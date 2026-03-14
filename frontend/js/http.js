import * as auth from './auth.js';
import * as cache from './data/cache.js';
import * as telemetry from './utils/telemetry.js';
import { uuid } from './utils/utility.js';

let baseUrl = '/api';

export function init(nextBaseUrl = '/api') {
  baseUrl = nextBaseUrl;
}

async function request(method, path, body, options = {}, retryCount = 0) {
  const url = `${baseUrl}${path}`;
  const cacheKey = `${method}:${url}`;
  if (method === 'GET' && !options.skipCache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const startedAt = performance.now();
  const headers = {
    'Content-Type': 'application/json',
    'X-Correlation-ID': uuid(),
    ...(options.headers || {}),
  };

  const token = window.sessionStorage.getItem('lr.token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    telemetry.http(method, path, response.status, Math.round(performance.now() - startedAt));

    if (response.status === 401 && auth.isAuthenticated()) {
      auth.logout();
      window.location.hash = '#/login';
      throw new Error('Session expired');
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.message || `Request failed: ${response.status}`);
    }

    if (method === 'GET' && !options.skipCache) {
      cache.set(cacheKey, data, options.ttlMs || 10000);
    }

    return data;
  } catch (error) {
    if (retryCount < 1) {
      await new Promise((resolve) => setTimeout(resolve, 350 * (retryCount + 1)));
      return request(method, path, body, options, retryCount + 1);
    }
    throw error;
  }
}

export function get(path, options) {
  return request('GET', path, null, options);
}

export function post(path, body, options) {
  return request('POST', path, body, options);
}

export function put(path, body, options) {
  return request('PUT', path, body, options);
}

export function patch(path, body, options) {
  return request('PATCH', path, body, options);
}

export function del(path, options) {
  return request('DELETE', path, null, options);
}
