"use client";

import { useEffect, useState } from "react";

export type WalletState = {
  /** Available Ixis, or null while loading / when unknown. */
  available: number | null;
  /** True when this Renoxis account is linked to an Apixis ID (signed in with Apixis). */
  linked: boolean;
  /** True once the first answer from /api/wallet/balance came back with a signed-in session. */
  loaded: boolean;
};

/**
 * The signed-in person's one Apixis Wallet balance. Refetches when the tab regains focus or
 * becomes visible again, and when the page is restored from the back/forward cache, so the
 * number updates right after a purchase on Apixis Wallet sends the person back here.
 */
export function useWalletState(): WalletState {
  const [state, setState] = useState<WalletState>({ available: null, linked: false, loaded: false });
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const load = () => {
      if (inFlight) return;
      inFlight = true;
      fetch("/api/wallet/balance", { cache: "no-store", credentials: "same-origin" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          setState({
            available: typeof data.available === "number" ? data.available : null,
            linked: data.linked === true,
            loaded: true,
          });
        })
        .catch(() => undefined)
        .finally(() => {
          inFlight = false;
        });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    load();
    window.addEventListener("focus", load);
    window.addEventListener("pageshow", load);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
      window.removeEventListener("pageshow", load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return state;
}

/** The signed-in person's one Apixis Wallet balance (null while loading or when unknown). */
export function useWalletBalance(): number | null {
  return useWalletState().available;
}
