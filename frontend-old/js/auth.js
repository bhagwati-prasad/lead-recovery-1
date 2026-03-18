import * as storage from './storage.js';
import * as state from './state.js';

const SESSION_TOKEN_KEY = 'lr.token';
const SESSION_USER_KEY = 'lr.user';
const SESSION_ROLE_KEY = 'lr.role';

export function init() {
  const token = storage.get(SESSION_TOKEN_KEY, 'session');
  const user = storage.get(SESSION_USER_KEY, 'session');
  const role = storage.get(SESSION_ROLE_KEY, 'session');
  if (token && user && role) {
    state.dispatch({ type: 'auth.set', payload: { token, user: JSON.parse(user), role } });
  }
}

export function isAuthenticated() {
  return Boolean(state.get('auth.token'));
}

export function hasRole(...roles) {
  const role = state.get('auth.role');
  return roles.includes(role);
}

export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const role = email.includes('admin') ? 'admin' : email.includes('readonly') ? 'readonly' : 'sales_manager';
  const token = `demo-${Date.now()}`;
  const user = { id: 'user-1', email, name: email.split('@')[0] };
  storage.set(SESSION_TOKEN_KEY, token, 'session');
  storage.set(SESSION_USER_KEY, JSON.stringify(user), 'session');
  storage.set(SESSION_ROLE_KEY, role, 'session');
  state.dispatch({ type: 'auth.set', payload: { token, user, role } });
  return { user, role, token };
}

export function logout() {
  storage.remove(SESSION_TOKEN_KEY, 'session');
  storage.remove(SESSION_USER_KEY, 'session');
  storage.remove(SESSION_ROLE_KEY, 'session');
  state.dispatch({ type: 'auth.set', payload: { token: null, user: null, role: null } });
}
