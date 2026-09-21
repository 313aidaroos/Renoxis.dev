/**
 * Outbound Apixis Wallet buy link.
 *
 * Contract: ApixisWallet `docs/WALLET_EMBED.md`.
 * `https://apixis-wallet.vercel.app/buy?product=renoxis&return_url=<https>`
 *
 * `return_url` is https on `renoxis.vercel.app` exactly, opening Cixy Studio.
 * Wallet rejects preview hosts. Credit stays on Wallet (Stripe webhook there).
 * This module does not call Stripe, invent a balance, or read
 * `GET /api/v1/wallet` — that route has no browser session or CORS contract yet.
 */

import { studioReturnUrl, walletBuyUrl } from "./wallet-link.ts";

export {
  APIXIS_WALLET_HOME,
  FALLBACK_WALLET_HREF,
  RENOXIS_APP_ORIGIN,
  studioReturnUrl,
  walletBuyUrl,
} from "./wallet-link.ts";

/**
 * https URL on renoxis.vercel.app, or the studio return when the candidate
 * is missing or not allowlisted. Preview hosts and localhost are not
 * allowlisted on production Wallet.
 */
export function allowlistedReturnUrl(candidate?: string | null): string {
  const fallback = studioReturnUrl();
  if (!candidate?.trim()) return fallback;
  let url: URL;
  try {
    url = new URL(candidate.trim());
  } catch {
    return fallback;
  }
  if (url.username || url.password) return fallback;
  if (url.protocol !== "https:" || url.port) return fallback;
  if (url.hostname !== "renoxis.vercel.app") return fallback;
  url.hash = "";
  return url.toString();
}

/**
 * Buy deep link. `appUrl` is accepted so pages can pass `APP_URL`, and is
 * ignored unless that origin is exactly https://renoxis.vercel.app. The
 * customer always returns to Cixy Studio.
 */
export function walletEntryUrl(appUrl?: string | null): string {
  const allowed = allowlistedReturnUrl(appUrl);
  const url = new URL(allowed);
  if (!url.searchParams.has("board")) url.searchParams.set("board", "Cixy Studio");
  return walletBuyUrl(url.toString());
}
