"use client";

import { useState } from "react";
import { CARD_BILLING_COPY } from "@/lib/renoxis/pricing";

export type SeatPayAction = {
  id: string;
  label: string;
  onRedeem: () => void;
};

/**
 * The customer picks Ixis or card. Ixis calls the existing Wallet redeem.
 * Card stays "Coming soon" — this site does not run Stripe.
 */
export function SeatPay({
  actions,
  busy,
  disabled = false,
  buyHref,
  shortfall,
}: {
  actions: SeatPayAction[];
  busy: boolean;
  disabled?: boolean;
  buyHref: string;
  shortfall: { message: string; buyUrl: string } | null;
}) {
  const [method, setMethod] = useState<"ixis" | "card">("ixis");
  const buy = shortfall?.buyUrl || buyHref;
  return (
    <div className="seat-pay">
      <div className="actions" role="group" aria-label="How to pay">
        <button
          type="button"
          className={method === "ixis" ? "primary" : ""}
          aria-pressed={method === "ixis"}
          onClick={() => setMethod("ixis")}
        >
          Pay with Ixis
        </button>
        <button
          type="button"
          className={method === "card" ? "primary" : ""}
          aria-pressed={method === "card"}
          onClick={() => setMethod("card")}
        >
          Pay by card
        </button>
      </div>
      {method === "card" ? (
        <p className="muted" role="status">
          <span className="coming-soon">Coming soon</span>
          {CARD_BILLING_COPY}
        </p>
      ) : (
        <>
          <div className="actions">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="primary"
                onClick={action.onRedeem}
                disabled={busy || disabled}
              >
                {busy ? "Working…" : action.label}
              </button>
            ))}
            <a className="soft-button" href={buy}>
              Buy Ixis
            </a>
          </div>
          {shortfall ? (
            <p className="form-error" role="alert">
              {shortfall.message} <a href={shortfall.buyUrl}>Buy Ixis</a>
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
