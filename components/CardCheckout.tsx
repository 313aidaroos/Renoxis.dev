"use client";

import { useState } from "react";
import { START_FEE, getMonthlyPrice } from "@/lib/renoxis/pricing";
import type { CardIntent } from "@/lib/renoxis/stripe-prices";

function label(intent: CardIntent) {
  if (intent === "activate") return `Pay $${START_FEE.usd} start fee by card`;
  const monthly = getMonthlyPrice();
  return `Pay $${monthly.usd}/month by card`;
}

/** Stripe Checkout button. Disabled, and still visible, when card env is unset. */
export function CardCheckout({
  intents,
  cardReady,
  disabled = false,
}: {
  intents: CardIntent[];
  cardReady: boolean;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState<CardIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const choices = intents.length ? intents : (["activate", "monthly"] as CardIntent[]);

  async function start(intent: CardIntent) {
    if (!cardReady || disabled || pending) return;
    setError(null);
    setPending(intent);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intent }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 && typeof data.redirect === "string") {
        window.location.assign(data.redirect);
        return;
      }
      if (!res.ok || typeof data.url !== "string") {
        setError(typeof data.error === "string" ? data.error : "Card checkout did not start. Nothing was charged.");
        setPending(null);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Card checkout did not start. Nothing was charged.");
      setPending(null);
    }
  }

  return (
    <>
      <div className="actions">
        {choices.map((intent) => (
          <button
            key={intent}
            type="button"
            className="primary"
            disabled={!cardReady || disabled || pending !== null}
            onClick={() => void start(intent)}
          >
            {pending === intent ? "Opening Stripe…" : label(intent)}
          </button>
        ))}
      </div>
      {!cardReady ? (
        <p className="muted" role="status">
          Card checkout is not configured.
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
