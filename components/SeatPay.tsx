"use client";

import { useState } from "react";
import { CardCheckout } from "./CardCheckout";
import type { CardIntent } from "@/lib/renoxis/stripe-prices";

export type SeatPayAction = {
  id: string;
  label: string;
  onRedeem: () => void;
};

/**
 * The customer picks Ixis or card. Ixis calls the existing Wallet redeem.
 * Card opens Stripe Checkout. A missing Stripe env disables that button.
 */
export function SeatPay({
  actions,
  busy,
  disabled = false,
  buyHref,
  shortfall,
  cardReady = false,
  initialMethod = "ixis",
}: {
  actions: SeatPayAction[];
  busy: boolean;
  disabled?: boolean;
  buyHref: string;
  shortfall: { message: string; buyUrl: string } | null;
  cardReady?: boolean;
  initialMethod?: "ixis" | "card";
}) {
  const [method, setMethod] = useState<"ixis" | "card">(initialMethod);
  const buy = shortfall?.buyUrl || buyHref;
  const cardIntents = actions
    .map((action) => action.id)
    .filter((id): id is CardIntent => id === "activate" || id === "monthly");
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
        <CardCheckout intents={cardIntents} cardReady={cardReady} disabled={disabled} />
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
