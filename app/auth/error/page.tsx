// 2026-09-28 Grok Developer Bot: Renoxis header + Cixy help, and a way back when a link expired.
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";

export default async function AuthError({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const reason = typeof params.reason === "string" ? params.reason : "";
  return (
    <AuthShell>
      <span className="welcome-kicker"><i /> RENOXIS · SIGN-IN</span>
      <h1>That link didn&apos;t work</h1>
      <p className="auth-lede">
        {reason || "Sign-in and reset links work once, on the device that asked for them, for about an hour."} Ask for a fresh one and try again.
      </p>
      <p><Link className="primary auth-apixis" href="/login">Back to log in</Link></p>
      <p className="auth-note"><Link href="/login?mode=forgot">Email me a new password reset link</Link></p>
    </AuthShell>
  );
}
