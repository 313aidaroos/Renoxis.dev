/**
 * Outbound Apixis Wallet entry.
 *
 * ApixisWallet has no `docs/WALLET_EMBED.md` and the wallet home does not read a
 * buy path. Until that contract is published, Buy Ixis and Wallet open the wallet
 * home with `origin` and an allowlisted `return_url`. Cash credit stays on Wallet
 * (Stripe webhook there). This module does not call Stripe or credit the firm ledger.
 *
 * TODO(embed): Do not call GET https://apixis-wallet.vercel.app/api/v1/wallet from
 * the browser. That route returns null balances until Supabase auth is connected
 * and sends no CORS headers. When WALLET_EMBED defines a session exchange and an
 * allowlisted browser read, show `available` beside the office ledger. Do not
 * invent a balance here.
 */

import {
  APIXIS_WALLET_HOME,
  RENOXIS_APP_ORIGIN,
} from "./wallet-link.ts";

export {
  APIXIS_WALLET_HOME,
  FALLBACK_WALLET_HREF,
  RENOXIS_APP_ORIGIN,
} from "./wallet-link.ts";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1"]);

function originOf(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol === "https:") return url.origin;
  if (url.protocol === "http:" && LOOPBACK.has(url.hostname)) return url.origin;
  return null;
}

/**
 * Return address after pay.
 * Always allows https://renoxis.vercel.app.
 * Also allows the origin of server `APP_URL` when that origin is https, or http
 * on localhost / 127.0.0.1. Any other candidate falls back to the canonical origin.
 * Pass only `process.env.APP_URL` — never a request parameter.
 */
export function allowlistedReturnUrl(appUrl?: string | null): string {
  const canonical = RENOXIS_APP_ORIGIN;
  const trusted = originOf(process.env.APP_URL);
  const requested = originOf(appUrl ?? process.env.APP_URL);
  if (requested === canonical) return canonical;
  if (trusted && requested === trusted) return trusted;
  return canonical;
}

/** Wallet home plus origin and return_url. Not a Renoxis checkout URL. */
export function walletEntryUrl(appUrl?: string | null): string {
  const url = new URL(APIXIS_WALLET_HOME);
  url.searchParams.set("origin", "renoxis");
  url.searchParams.set("return_url", allowlistedReturnUrl(appUrl));
  return url.toString();
}
