"use client";

import { useState } from "react";
import { activateCopy, renewCopy } from "@/lib/renoxis/billing";
import { CardCheckout } from "./CardCheckout";

/** Public checkout choice. Ixis continues into sign-in and the Wallet redeem. Card opens Stripe Checkout. */
export function PricingCheckout({
  startHref,
  renewHref,
  buyHref,
  cardReady = false,
  initialMethod = "ixis",
}: {
  startHref: string;
  renewHref: string;
  buyHref: string;
  cardReady?: boolean;
  initialMethod?: "ixis" | "card";
}) {
  const [method, setMethod] = useState<"ixis" | "card">(initialMethod);
  return (
    <div className="seat-pay" id="pay">
      <div className="welcome-actions" role="group" aria-label="How to pay">
        <button type="button" className={method === "ixis" ? "primary" : ""} aria-pressed={method === "ixis"} onClick={() => setMethod("ixis")}>
          Pay with Ixis
        </button>
        <button type="button" className={method === "card" ? "primary" : ""} aria-pressed={method === "card"} onClick={() => setMethod("card")}>
          Pay by card
        </button>
      </div>
      {method === "card" ? (
        <CardCheckout intents={["activate", "monthly"]} cardReady={cardReady} />
      ) : (
        <div className="welcome-actions">
          <a className="primary" href={startHref}>{activateCopy()}</a>
          <a href={renewHref}>{renewCopy()}</a>
          <a href={buyHref}>Buy Ixis</a>
        </div>
      )}
    </div>
  );
}
