const listeners = new Map();

export function init() {
  return true;
}

export function on(eventName, callback) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set());
  }
  listeners.get(eventName).add(callback);
  return () => off(eventName, callback);
}

export function off(eventName, callback) {
  const bucket = listeners.get(eventName);
  if (!bucket) {
    return;
  }
  bucket.delete(callback);
}

export function emit(eventName, payload) {
  const bucket = listeners.get(eventName);
  if (!bucket) {
    return;
  }
  bucket.forEach((callback) => callback(payload));
}
