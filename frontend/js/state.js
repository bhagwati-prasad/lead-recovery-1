import * as events from './events.js';

const subscribers = [];

const initialState = {
  auth: { user: null, token: null, role: null },
  nav: { activeTab: 'dashboard', breadcrumb: [] },
  customers: { list: [], selected: null, filters: {}, pagination: {} },
  funnels: { list: [], selected: null, stages: [] },
  calls: { active: [], log: [], making: false },
  agents: { list: [], selected: null },
  analytics: { summary: null, charts: {} },
  settings: { current: {} },
  notifications: { queue: [] },
  ui: { loading: false, error: null, theme: 'dark' },
};

let data = structuredClone(initialState);

export function init() {
  data = structuredClone(initialState);
}

function readPath(path) {
  return path.split('.').reduce((cursor, key) => (cursor ? cursor[key] : undefined), data);
}

export function get(path) {
  if (!path) {
    return data;
  }
  return readPath(path);
}

function writePath(path, value) {
  const parts = path.split('.');
  const next = structuredClone(data);
  let cursor = next;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    cursor[part] = structuredClone(cursor[part]);
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
  data = next;
}

export function set(path, value) {
  writePath(path, value);
  subscribers.forEach((entry) => {
    if (path.startsWith(entry.path)) {
      entry.cb(value, path);
    }
  });
  events.emit('state.changed', { path, value });
}

export function subscribe(path, cb) {
  subscribers.push({ path, cb });
  return () => {
    const idx = subscribers.findIndex((entry) => entry.path === path && entry.cb === cb);
    if (idx >= 0) {
      subscribers.splice(idx, 1);
    }
  };
}

export function dispatch(action) {
  if (!action || !action.type) {
    return;
  }
  switch (action.type) {
    case 'auth.set':
      set('auth', { ...get('auth'), ...action.payload });
      break;
    case 'nav.set':
      set('nav', { ...get('nav'), ...action.payload });
      break;
    case 'ui.error':
      set('ui.error', action.payload || null);
      break;
    default:
      break;
  }
}
