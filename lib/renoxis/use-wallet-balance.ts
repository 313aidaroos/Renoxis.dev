"use client";

import { useEffect, useState } from "react";

/** The signed-in person's one Apixis Wallet balance (null while loading or when unknown). */
export function useWalletBalance(): number | null {
  const [available, setAvailable] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/wallet/balance", { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.available === "number") setAvailable(data.available);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return available;
}
