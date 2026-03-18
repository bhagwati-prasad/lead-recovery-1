"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/lib/auth/context";

export function LoginForm() {
  const { login, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, redirect, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <section className="auth-page auth-form-card">
        <h1>Lead Recovery</h1>
        <p>Sign in to continue</p>
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="field">
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="field-input"
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <div className="field">
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="field-input"
            />
          </div>
          {error && (
            <p id="login-error" role="alert" className="field-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="auth-hint">
          Demo: email containing &quot;admin&quot; → admin role,
          &quot;readonly&quot; → read-only, anything else → sales_manager.
        </p>
      </section>
    </div>
  );
}
