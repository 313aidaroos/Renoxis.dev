import type { SupabaseClient } from "@supabase/supabase-js";
import type { SeatGrant, StripeSeatStore } from "./stripe-seat.ts";

function seatFrom(row: {
  user_id: string;
  activated_at: string | null;
  seat_period_end: string | null;
  source: string;
  last_receipt_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}): SeatGrant {
  return {
    userId: row.user_id,
    activatedAt: row.activated_at,
    seatPeriodEnd: row.seat_period_end,
    source: row.source === "wallet_capture" ? "wallet_capture" : "card",
    lastReceiptId: row.last_receipt_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
  };
}

/** Service-role writer. The migration must be applied before this succeeds. */
export function supabaseStripeSeatStore(admin: SupabaseClient): StripeSeatStore {
  return {
    async claimEvent(eventId, eventType) {
      const { error } = await admin.from("renoxis_stripe_events").insert({
        event_id: eventId,
        event_type: eventType,
      });
      if (!error) return true;
      if (error.code === "23505") return false;
      console.error("stripe event claim failed", error.code);
      throw new Error("Could not record the Stripe event.");
    },
    async releaseEvent(eventId) {
      const { error } = await admin.from("renoxis_stripe_events").delete().eq("event_id", eventId);
      if (error) console.error("stripe event release failed", error.code);
    },
    async readSeat(userId) {
      const { data, error } = await admin
        .from("renoxis_entitlements")
        .select("user_id, activated_at, seat_period_end, source, last_receipt_id, stripe_customer_id, stripe_subscription_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.error("seat read failed", error.code);
        throw new Error("Could not read the seat.");
      }
      return data ? seatFrom(data) : null;
    },
    async writeSeat(seat) {
      const { data: current } = await admin
        .from("renoxis_entitlements")
        .select("version")
        .eq("user_id", seat.userId)
        .maybeSingle();
      const version = typeof current?.version === "number" ? current.version + 1 : 1;
      const { error } = await admin.from("renoxis_entitlements").upsert(
        {
          user_id: seat.userId,
          activated_at: seat.activatedAt,
          seat_period_end: seat.seatPeriodEnd,
          source: seat.source,
          last_receipt_id: seat.lastReceiptId,
          stripe_customer_id: seat.stripeCustomerId,
          stripe_subscription_id: seat.stripeSubscriptionId,
          version,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) {
        console.error("seat write failed", error.code);
        throw new Error("Could not update the seat.");
      }
    },
    async findUserBySubscription(subscriptionId) {
      const { data, error } = await admin
        .from("renoxis_entitlements")
        .select("user_id")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();
      if (error) {
        console.error("subscription lookup failed", error.code);
        throw new Error("Could not find the subscription.");
      }
      return typeof data?.user_id === "string" ? data.user_id : null;
    },
  };
}
