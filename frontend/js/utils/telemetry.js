let endpoint = '/api/telemetry';

export function init(nextEndpoint = '/api/telemetry') {
  endpoint = nextEndpoint;
  window.addEventListener('error', (event) => error(event.error || event.message));
  window.addEventListener('unhandledrejection', (event) => error(event.reason));
}

function send(payload) {
  navigator.sendBeacon(endpoint, JSON.stringify(payload));
}

export function pageView(route) {
  send({ type: 'page_view', route, at: new Date().toISOString() });
}

export function event(category, action, label) {
  send({ type: 'event', category, action, label, at: new Date().toISOString() });
}

export function error(err) {
  send({ type: 'error', message: String(err || 'unknown'), at: new Date().toISOString() });
}

export function http(method, url, status, durationMs) {
  send({ type: 'http', method, url, status, durationMs, at: new Date().toISOString() });
}
