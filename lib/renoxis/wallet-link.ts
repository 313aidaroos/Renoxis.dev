/** Public wallet entry constants. No server env — safe for client components. */

export const APIXIS_WALLET_HOME = "https://apixis-wallet.vercel.app";
export const RENOXIS_APP_ORIGIN = "https://renoxis.vercel.app";

/** Stable href when APP_URL is unset. */
export const FALLBACK_WALLET_HREF = `${APIXIS_WALLET_HOME}/?origin=renoxis&return_url=${encodeURIComponent(RENOXIS_APP_ORIGIN)}`;
