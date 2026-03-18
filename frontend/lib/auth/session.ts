import type { AuthUser, Role, Session } from "./types";

const TOKEN_KEY = "lr.token";
const USER_KEY = "lr.user";
const ROLE_KEY = "lr.role";

function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; samesite=lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function saveSession(session: Session): void {
  setCookie(TOKEN_KEY, session.token);
  setCookie(USER_KEY, JSON.stringify(session.user));
  setCookie(ROLE_KEY, session.role);
}

export function readSession(): Session | null {
  const token = getCookie(TOKEN_KEY);
  const userRaw = getCookie(USER_KEY);
  const role = getCookie(ROLE_KEY) as Role | null;
  if (!token || !userRaw || !role) return null;
  try {
    const user = JSON.parse(userRaw) as AuthUser;
    return { token, user, role };
  } catch {
    return null;
  }
}

export function clearSession(): void {
  deleteCookie(TOKEN_KEY);
  deleteCookie(USER_KEY);
  deleteCookie(ROLE_KEY);
}

// Demo auth — mirrors legacy behavior in frontend-old/js/auth.js.
// Replace with a real API call when backend auth is implemented.
export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<Session> {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  const role: Role = email.includes("admin")
    ? "admin"
    : email.includes("readonly")
      ? "readonly"
      : "sales_manager";
  const token = `demo-${Date.now()}`;
  const user: AuthUser = { id: "user-1", email, name: email.split("@")[0] };
  const session: Session = { token, user, role };
  saveSession(session);
  return session;
}
