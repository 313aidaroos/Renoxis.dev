/**
 * Owner allowlist (Awad's rule, 2026-10-04 Grok). A signed-in owner with a CONFIRMED email skips
 * the Renoxis seat gate and per-use Ixis charges for product features. Product gates only: no
 * entitlement row is written and the Wallet is never called, so nothing touches the Wallet ledger.
 * ADMIN_EMAILS (comma-separated, Vercel env) adds to this fallback list. Case-insensitive.
 */
export const OWNER_ADMIN_EMAILS = ["alaidaroosawad@gmail.com", "awad@apixis.dev"] as const;

export function ownerEmails(env: string | undefined = process.env.ADMIN_EMAILS): Set<string> {
  const list = new Set<string>(OWNER_ADMIN_EMAILS);
  for (const raw of String(env ?? "").split(",")) {
    const email = raw.trim().toLowerCase();
    if (email.includes("@")) list.add(email);
  }
  return list;
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  const e = String(email ?? "").trim().toLowerCase();
  return Boolean(e) && ownerEmails().has(e);
}

/** Only a confirmed email counts; an unconfirmed sign-up with an owner address gets nothing. */
export function isOwner(
  user: { email?: string | null; email_confirmed_at?: string | null } | null | undefined,
): boolean {
  return Boolean(user?.email_confirmed_at) && isOwnerEmail(user?.email);
}
