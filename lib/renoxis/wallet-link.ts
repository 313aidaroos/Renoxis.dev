/** Public wallet entry constants. No server env — safe for client components. */

export const APIXIS_WALLET_HOME = "https://apixis-wallet.vercel.app";
export const RENOXIS_APP_ORIGIN = "https://renoxis.vercel.app";

/** Cixy Studio on the production host Wallet allowlists exactly. */
export function studioReturnUrl(): string {
  const url = new URL(RENOXIS_APP_ORIGIN);
  url.searchParams.set("board", "Cixy Studio");
  return url.toString();
}

/** Wallet buy deep link. `returnUrl` must already be allowlisted. */
export function walletBuyUrl(returnUrl: string = studioReturnUrl()): string {
  const url = new URL("/buy", APIXIS_WALLET_HOME);
  url.searchParams.set("product", "renoxis");
  url.searchParams.set("return_url", returnUrl);
  return url.toString();
}

/** Stable href when APP_URL is unset. */
export const FALLBACK_WALLET_HREF = walletBuyUrl();
