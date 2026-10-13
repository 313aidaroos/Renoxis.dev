"use client";

import { useState } from "react";
import { activateCopy, renewCopy } from "@/lib/renoxis/billing";
import { CARD_BILLING_COPY } from "@/lib/renoxis/pricing";

/** Public checkout choice. Ixis continues into sign-in and the Wallet redeem. Card does not charge. */
export function PricingCheckout({
  startHref,
  renewHref,
  buyHref,
}: {
  startHref: string;
  renewHref: string;
  buyHref: string;
}) {
  const [method, setMethod] = useState<"ixis" | "card">("ixis");
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
        <p role="status"><strong>Coming soon.</strong> {CARD_BILLING_COPY}</p>
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
