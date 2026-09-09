const DB_NAME = "toy-shop-cache";
const STORE_NAME = "responses";
const VERSION = 1;
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function openDb() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheGet(key, maxAgeMs = CACHE_TTL_MS) {
  try {
    const db = await openDb();
    if (!db) return null;
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => {
        const record = req.result;
        if (!record) return resolve(null);
        if (maxAgeMs >= 0 && Date.now() - (record.updatedAt || 0) > maxAgeMs) return resolve(null);
        resolve(record.value ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function cacheSet(key, value) {
  try {
    const db = await openDb();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put({ key, value, updatedAt: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Cache failure must never break the app.
  }
}

export async function cacheRemove(key) {
  try {
    const db = await openDb();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

export async function cacheClearPrefix(prefix) {
  try {
    const db = await openDb();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        if (String(cursor.key).startsWith(prefix)) cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

export async function invalidate(keys = [], prefixes = []) {
  await Promise.all([
    ...keys.map(cacheRemove),
    ...prefixes.map(cacheClearPrefix)
  ]);
}

/**
 * Cache-first: return IndexedDB immediately when available.
 * If missing or forceRefresh=true, call the API and store the response.
 */
export async function cachedGet(api, url, { key = url, forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = await cacheGet(key);
    if (cached !== null && cached !== undefined) {
      return { data: cached, fromCache: true };
    }
  }
  const response = await api.get(url);
  await cacheSet(key, response.data);
  return { data: response.data, fromCache: false };
}
