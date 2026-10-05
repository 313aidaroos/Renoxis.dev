/**
 * Renoxis email-link (magic link) sign-in is for EXISTING Renoxis email accounts only.
 * New people sign up with Apixis ID (Wallet SSO), never here. Awad's decision 2026-10-04.
 * Every `signInWithOtp` call must pass these options so Supabase never creates a user.
 */
export function emailLinkOptions(emailRedirectTo: string): { emailRedirectTo: string; shouldCreateUser: false } {
  return { emailRedirectTo, shouldCreateUser: false };
}

export const NO_EMAIL_ACCOUNT_MESSAGE =
  "There’s no Renoxis email account for that address. New here? Choose Log in with Apixis ID to create your account.";

/** Supabase answers "Signups not allowed for otp" (or similar) when the email has no account. */
export function emailLinkError(message: string): string | null {
  return /signups? not allowed|user not found|not allowed for otp/i.test(message) ? NO_EMAIL_ACCOUNT_MESSAGE : null;
}
