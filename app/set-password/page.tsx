"use client";

// 2026-09-28 Grok Developer Bot: Renoxis header + Cixy help; ?reset=1 is the "Forgot password?"
// landing (the reset link signs you in through /auth/callback first). No Skip on a reset.
import { safeLocalRedirect } from "@/lib/apixis-redirect";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";

function SetPasswordContent() {
  const searchParams = useSearchParams();
  const next = safeLocalRedirect(searchParams.get("next"));
  const reset = searchParams.get("reset") === "1";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expired, setExpired] = useState(false);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setExpired(true);
        setMessage(reset ? "This reset link has expired or was already used. Request a new one below." : "Your session has ended. Please log in again.");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password, data: { has_password: true } });
      if (error) setMessage(/different from the old/i.test(error.message) ? "Choose a password you haven't used here before." : error.message);
      else window.location.assign(next);
    } catch {
      setMessage("Failed to set password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <span className="welcome-kicker"><i /> {reset ? "RENOXIS · PASSWORD RESET" : "RENOXIS · APIXIS ID"}</span>
      <h1>{reset ? "Choose a new password" : "Choose a password"}</h1>
      <p className="auth-lede">
        {reset ? "Pick a new password for your Renoxis account. You'll go straight back to your desk." : "Next time you can sign in without waiting for an email."}
      </p>
      <form className="auth-form" onSubmit={handleSetPassword}>
        {message && <p className="auth-status error" role="alert">{message}</p>}
        <label htmlFor="password">{reset ? "New password" : "Password"}</label>
        <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
        <button type="submit" className="primary" disabled={loading}>{loading ? "Saving…" : reset ? "Save new password and continue" : "Set password"}</button>
      </form>
      {expired ? (
        <p className="auth-note"><a href={`/login?mode=forgot&next=${encodeURIComponent(next)}`}>Email me a new reset link</a></p>
      ) : reset ? (
        <p className="auth-note"><a href="/login">← Back to log in</a></p>
      ) : (
        <p className="auth-note"><a href={next}>Skip for now →</a></p>
      )}
    </AuthShell>
  );
}

export default function SetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SetPasswordContent />
    </Suspense>
  );
}
