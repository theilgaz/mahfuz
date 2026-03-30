/**
 * IndexedDB-based model caching with streaming download + progress.
 * Ported from offline-tarteel.
 */

const DB_NAME = "mahfuz-recitation-models";
const STORE_NAME = "models";
const MODEL_KEY = "fastconformer-phoneme-ctc-v1";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getFromCache(key: string): Promise<ArrayBuffer | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function saveToCache(key: string, data: ArrayBuffer): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(data, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function isModelCached(): Promise<boolean> {
  try {
    const cached = await getFromCache(MODEL_KEY);
    return cached !== null;
  } catch {
    return false;
  }
}

export async function loadModel(
  url: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<ArrayBuffer> {
  // Try IndexedDB cache first
  const cached = await getFromCache(MODEL_KEY);
  if (cached) return cached;

  // Download with progress
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Model download failed: ${response.status}`);

  const total = parseInt(response.headers.get("content-length") || "0");
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, total);
  }

  const buffer = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  // Cache for future use
  await saveToCache(MODEL_KEY, buffer.buffer);
  return buffer.buffer;
}
