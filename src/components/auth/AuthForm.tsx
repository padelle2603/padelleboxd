"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm({
  mode,
}: {
  mode: "login" | "register";
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isLogin && password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const body = isLogin
        ? { identifier, password }
        : { username, email, password };
      const res = await fetch(
        isLogin ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (isLogin) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setSuccess(
          "Account created! Your account is waiting for an administrator to approve it. You'll be able to log in once approved."
        );
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirm("");
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {isLogin ? (
        <Field label="Username or email" id="identifier">
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="auth-input"
          />
        </Field>
      ) : (
        <>
          <Field label="Username" id="username">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="auth-input"
            />
          </Field>
          <Field label="Email" id="email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="auth-input"
            />
          </Field>
        </>
      )}
      <Field label="Password" id="password">
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="auth-input"
        />
      </Field>
      {!isLogin && (
        <Field label="Confirm password" id="confirm">
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="auth-input"
          />
        </Field>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
        {label}
      </label>
      {children}
    </div>
  );
}