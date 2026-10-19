/**
 * Seat rows written by the Stripe webhook.
 * Same table and fields as the Wallet path: renoxis_entitlements
 * (activated_at, seat_period_end, source, last_receipt_id).
 * Card payments never grant Ixis.
 */

export type SeatGrant = {
  userId: string;
  activatedAt: string | null;
  seatPeriodEnd: string | null;
  source: "wallet_capture" | "card";
  lastReceiptId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export type StripeSeatStore = {
  /** True the first time this Stripe event id is seen. */
  claimEvent(eventId: string, eventType: string): Promise<boolean>;
  releaseEvent(eventId: string): Promise<void>;
  readSeat(userId: string): Promise<SeatGrant | null>;
  writeSeat(seat: SeatGrant): Promise<void>;
  findUserBySubscription(subscriptionId: string): Promise<string | null>;
};

export function laterIso(current: string | null, next: string | null) {
  if (!current) return next;
  if (!next) return current;
  const left = Date.parse(current);
  const right = Date.parse(next);
  if (!Number.isFinite(left)) return next;
  if (!Number.isFinite(right)) return current;
  return left >= right ? current : next;
}

/** End access now, without moving an already-lapsed period forward. */
export function revokeIso(current: string | null, at: Date) {
  const stamp = at.toISOString();
  if (!current) return stamp;
  const existing = Date.parse(current);
  if (!Number.isFinite(existing) || existing > at.getTime()) return stamp;
  return current;
}
