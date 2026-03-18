const cacheStore = new Map();

export function init() {
  cacheStore.clear();
}

export function get(key) {
  const entry = cacheStore.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
}

export function set(key, value, ttlMs = 0) {
  cacheStore.set(key, {
    value,
    expiresAt: ttlMs > 0 ? Date.now() + ttlMs : null,
  });
}

export function clear() {
  cacheStore.clear();
}
