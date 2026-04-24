import { createServer } from "node:http";
import { readFile, stat, readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzip as gzipCb } from "node:zlib";
import { promisify } from "node:util";

const gzip = promisify(gzipCb);

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = parseInt(process.env.PORT || "3001", 10);

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

// Content types eligible for gzip compression
const COMPRESSIBLE = new Set([
  "text/html", "application/javascript", "text/css",
  "application/json", "image/svg+xml", "application/xml",
  "text/plain", "application/manifest+json",
]);

// Paths with immutable content — cache for 1 year
// Keep in sync with sw.js immutable path checks
const IMMUTABLE_PREFIXES = [
  "/assets/",
  "/fonts/",
  "/quran/",
  "/translations/",
  "/mushaf-lines/",
  "/mushaf-pages/",
  "/mushaf-images/",
  "/tajweed/",
  "/imlaei/",
  "/models/",
  "/qcf-words/",
];

function getCacheControl(pathname) {
  if (IMMUTABLE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=3600";
}

async function compressAndSend(req, res, statusCode, headers, body) {
  const contentType = headers["Content-Type"] || "";
  const acceptEncoding = req.headers["accept-encoding"] || "";
  const shouldCompress = COMPRESSIBLE.has(contentType) && body.length > 1024 && acceptEncoding.includes("gzip");

  if (shouldCompress) {
    const compressed = await gzip(body);
    res.writeHead(statusCode, { ...headers, "Content-Encoding": "gzip", "Content-Length": compressed.length, "Vary": "Accept-Encoding" });
    res.end(compressed);
  } else {
    res.writeHead(statusCode, { ...headers, "Content-Length": body.length });
    res.end(body);
  }
}

async function tryServeStatic(req, res, basePath) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const filePath = join(basePath, decodeURIComponent(url.pathname));

  if (!filePath.startsWith(basePath)) return false;

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return false;

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const data = await readFile(filePath);
    const cacheControl = getCacheControl(url.pathname);

    await compressAndSend(req, res, 200, { "Content-Type": contentType, "Cache-Control": cacheControl }, data);
    return true;
  } catch {
    return false;
  }
}

function toWebRequest(req) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.set(key, value);
      }
    }
  }

  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req;
    init.duplex = "half";
  }

  return new Request(url.href, init);
}

async function sendWebResponse(req, res, webResponse) {
  const headers = {};
  webResponse.headers.forEach((value, key) => {
    if (headers[key]) {
      headers[key] = Array.isArray(headers[key])
        ? [...headers[key], value]
        : [headers[key], value];
    } else {
      headers[key] = value;
    }
  });

  if (!webResponse.body) {
    res.writeHead(webResponse.status, headers);
    res.end();
    return;
  }

  // Buffer the response body
  const chunks = [];
  const reader = webResponse.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = Buffer.concat(chunks);

  await compressAndSend(req, res, webResponse.status, headers, body);
}

async function main() {
  // Drizzle migration on startup
  try {
    const { drizzle } = await import("drizzle-orm/libsql");
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    const { createClient } = await import("@libsql/client");

    const dbUrl = process.env.TURSO_DATABASE_URL;
    if (dbUrl) {
      const client = createClient({
        url: dbUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      const db = drizzle(client);
      await migrate(db, { migrationsFolder: join(__dirname, "drizzle") });
      console.log("[mahfuz-core] Drizzle migrations applied");
    } else {
      console.log("[mahfuz-core] No TURSO_DATABASE_URL, skipping migrations");
    }
  } catch (err) {
    console.error("[mahfuz-core] Migration error (non-fatal):", err.message);
  }

  // TanStack Start SSR handler
  const serverEntry = await import("./dist/server/server.js");
  const handler = serverEntry.default?.fetch ?? serverEntry.default;

  if (typeof handler !== "function") {
    console.error("[mahfuz-core] Could not find fetch handler in dist/server/server.js");
    process.exit(1);
  }

  const clientDir = join(__dirname, "dist", "client");

  // Startup diagnostics
  try {
    const clientStat = await stat(clientDir);
    if (clientStat.isDirectory()) {
      const entries = await readdir(clientDir);
      console.log(`[mahfuz-core] Static dir: ${clientDir} (${entries.length} entries: ${entries.slice(0, 8).join(", ")}${entries.length > 8 ? "..." : ""})`);
    }
  } catch {
    console.error(`[mahfuz-core] WARNING: Static dir not found: ${clientDir}`);
  }

  const server = createServer(async (req, res) => {
    try {
      if (await tryServeStatic(req, res, clientDir)) return;

      const webRequest = toWebRequest(req);
      const webResponse = await handler(webRequest);
      await sendWebResponse(req, res, webResponse);
    } catch (err) {
      console.error("[mahfuz-core] Request error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    }
  });

  server.listen(PORT, () => {
    console.log(`[mahfuz-core] Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("[mahfuz-core] Fatal:", err);
  process.exit(1);
});
