"use client";

// 2026-09-28 Grok Developer Bot: "Log in with Apixis ID", Renoxis home header, Forgot password,
// Cixy sign-in help. Email link and password sign-in (Renoxis accounts) are kept.
import { safeLocalRedirect } from "@/lib/apixis-redirect";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";

type Mode = "magic" | "password" | "forgot" | "sent";

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Invalid email or password.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first. Check your inbox for the confirmation link.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Please wait a minute and try again.";
  return message || "Something went wrong. Please try again.";
}

function LoginContent() {
  const searchParams = useSearchParams();
  const next = safeLocalRedirect(searchParams.get("next"), "/dashboard");
  const initial = searchParams.get("mode");
  const [mode, setMode] = useState<Mode>(initial === "password" || initial === "forgot" ? initial : "magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ title: string; body: string } | null>(null);
  const sentTitle = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (mode === "sent") sentTitle.current?.focus();
  }, [mode]);

  function go(m: Mode) {
    setError("");
    setMode(m);
  }

  const callback = (target: string) => {
    const url = new URL(`${window.location.origin}/auth/callback`);
    url.searchParams.set("next", target);
    return url.toString();
  };

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: callback(next) } });
      if (error) setError(friendly(error.message));
      else {
        setSent({ title: "Check your email", body: `We sent a sign-in link to ${email}. Open it on this device within an hour.` });
        setMode("sent");
      }
    } catch {
      setError("Unable to connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) setError(friendly(error.message));
      else window.location.assign(next);
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const target = `/set-password?reset=1&next=${encodeURIComponent(next)}`;
      const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: callback(target) });
      if (error && /rate limit|too many/i.test(error.message)) setError(friendly(error.message));
      else {
        // Same answer whether or not the address has an account.
        setSent({
          title: "Check your email",
          body: `If ${email} has a Renoxis password, a reset link is on its way. Open it on this device within an hour.`,
        });
        setMode("sent");
      }
    } catch {
      setError("Unable to connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const apixisHref = `/auth/apixis/start?next=${encodeURIComponent(next)}`;

  return (
    <AuthShell>
      {mode === "sent" && sent ? (
        <div className="auth-sent" aria-live="polite">
          <span className="welcome-kicker"><i /> RENOXIS · APIXIS ID</span>
          <h2 ref={sentTitle} tabIndex={-1}>{sent.title}</h2>
          <p className="auth-lede">{sent.body}</p>
          <button type="button" className="text-button auth-back" onClick={() => go("magic")}>← Back to log in</button>
        </div>
      ) : mode === "forgot" ? (
        <>
          <span className="welcome-kicker"><i /> RENOXIS · PASSWORD RESET</span>
          <h1>Reset your password</h1>
          <p className="auth-lede">
            Enter the email you use with a Renoxis password. We will email a link to choose a new one.
            Use Apixis ID? Reset it from <a href={apixisHref}>Log in with Apixis ID</a> instead.
          </p>
          <form className="auth-form" onSubmit={handleForgot} noValidate={false}>
            {error && <p className="auth-status error" role="alert">{error}</p>}
            <label htmlFor="forgot-email">Email</label>
            <input id="forgot-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <button type="submit" className="primary" disabled={loading}>{loading ? "Sending…" : "Email me a reset link"}</button>
          </form>
          <p className="auth-note"><button type="button" className="text-button auth-back" onClick={() => go("password")}>← Back to log in</button></p>
        </>
      ) : (
        <>
          <span className="welcome-kicker"><i /> RENOXIS · APIXIS ID</span>
          <h1>Log in with Apixis ID</h1>
          <p className="auth-lede">One account for Renoxis, Apixis Wallet and every Apixis company.</p>
          <a className="primary auth-apixis" href={apixisHref}>Log in with Apixis ID</a>
          <p className="auth-note">New here? Your account comes with your own Apixis world agent and <strong>1,000 Ixis</strong> to start. Ixis has no cash value.</p>
          <div className="auth-divider">or use your Renoxis email</div>
          <div className="auth-tabs" role="tablist" aria-label="How to log in">
            <button type="button" role="tab" id="tab-magic" aria-controls="panel-login" aria-selected={mode === "magic"} onClick={() => go("magic")}>Email link</button>
            <button type="button" role="tab" id="tab-password" aria-controls="panel-login" aria-selected={mode === "password"} onClick={() => go("password")}>Password</button>
          </div>
          {mode === "magic" ? (
            <form id="panel-login" role="tabpanel" aria-labelledby="tab-magic" className="auth-form" onSubmit={handleMagicLink}>
              {error && <p className="auth-status error" role="alert">{error}</p>}
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <button type="submit" className="primary" disabled={loading}>{loading ? "Sending…" : "Email me a sign-in link"}</button>
              <p className="auth-note">No password needed. New here? The link starts your account.</p>
            </form>
          ) : (
            <form id="panel-login" role="tabpanel" aria-labelledby="tab-password" className="auth-form" onSubmit={handlePassword}>
              {error && <p className="auth-status error" role="alert">{error}</p>}
              <label htmlFor="email-pwd">Email</label>
              <input id="email-pwd" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <label htmlFor="password">Password</label>
              <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your Renoxis password" />
              <div className="auth-row"><button type="button" className="text-button" onClick={() => go("forgot")}>Forgot password?</button></div>
              <button type="submit" className="primary" disabled={loading}>{loading ? "Signing in…" : "Log in"}</button>
            </form>
          )}
          <p className="auth-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></p>
        </>
      )}
    </AuthShell>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
