import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as authSchema from "./schema";
import * as quranSchema from "./quran-schema";
import * as ikraSchema from "./ikra-schema";

function resolveDbUrl(): string {
  const envUrl = process.env.TURSO_DATABASE_URL;
  // Remote Turso URL — use as-is
  if (envUrl && !envUrl.startsWith("file:")) return envUrl;
  // Local file — resolve relative to this package's root (apps/web/)
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dbPath = envUrl?.replace("file:", "") || "./local.db";
  return `file:${resolve(__dirname, "../..", dbPath)}`;
}

const client = createClient({
  url: resolveDbUrl(),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, {
  schema: { ...authSchema, ...quranSchema, ...ikraSchema },
});

export type Database = typeof db;

export * from "./schema";
export * from "./quran-schema";
export * from "./ikra-schema";
