import { createHash } from "node:crypto";
import { redeem } from "../apixis-wallet.ts";
import type { Entitlement } from "./billing.ts";

export type SeatIntent = "activate" | "monthly";
export type SeatStore = {
  stage(input: { userId: string; intent: SeatIntent; attemptId: string; reservationId: string }): Promise<Entitlement>;
  settle(input: { userId: string; intent: SeatIntent; attemptId: string; reservationId: string; captured: boolean; receiptId?: string }): Promise<void>;
};
// Hash the entire identity and attempt: no truncated user IDs and no collisions across users.
export function seatPurchaseKey(userId: string, intent: SeatIntent, attemptId: string) {
  return `rx-${intent}-${createHash("sha256").update(JSON.stringify([userId, intent, attemptId])).digest("hex")}`;
}
export async function purchaseSeat(input: { userId: string; owner: string; intent: SeatIntent; attemptId: string }, store: SeatStore) {
  let reservationId = "";
  const result = await redeem<Entitlement>({
    owner: input.owner,
    productKey: input.intent === "activate" ? "renoxis.activate" : "renoxis.agent.monthly",
    idempotencyKey: seatPurchaseKey(input.userId, input.intent, input.attemptId),
    provision: async (reservation) => {
      reservationId = reservation.reservationId;
      return store.stage({ ...input, reservationId });
    },
    unprovision: async () => store.settle({ ...input, reservationId, captured: false }),
  });
  if (result.ok) {
    // A missing receipt or failed local commit is uncertain, never "nothing charged".
    if (!result.receiptId) throw new Error("Capture receipt unavailable; retry this same attempt.");
    await store.settle({ ...input, reservationId, captured: true, receiptId: result.receiptId });
  }
  return result;
}
