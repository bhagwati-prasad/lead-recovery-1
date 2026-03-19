const memoryStore = new Map();

function safeStorage(type) {
  try {
    const ref = window[type];
    const probe = '__lr_probe__';
    ref.setItem(probe, '1');
    ref.removeItem(probe);
    return ref;
  } catch {
    return null;
  }
}

let localRef;
let sessionRef;

export function init() {
  localRef = safeStorage('localStorage');
  sessionRef = safeStorage('sessionStorage');
}

function getRef(scope) {
  if (scope === 'session') {
    return sessionRef;
  }
  return localRef;
}

export function get(key, scope = 'local') {
  const ref = getRef(scope);
  if (ref) {
    return ref.getItem(key);
  }
  return memoryStore.get(scope + ':' + key) || null;
}

export function set(key, value, scope = 'local') {
  const ref = getRef(scope);
  if (ref) {
    ref.setItem(key, value);
    return;
  }
  memoryStore.set(scope + ':' + key, value);
}

export function remove(key, scope = 'local') {
  const ref = getRef(scope);
  if (ref) {
    ref.removeItem(key);
    return;
  }
  memoryStore.delete(scope + ':' + key);
}
