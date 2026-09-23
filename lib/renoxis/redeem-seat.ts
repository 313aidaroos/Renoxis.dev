import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redeem, WalletError, buyIxisUrl } from "@/lib/apixis-wallet";
import type { Entitlement } from "@/lib/renoxis/billing";

const APP_SLUG = "renoxis";
const APP_URL = process.env.APP_URL || "https://renoxis.dev";
const ATTEMPT_ID = /^[A-Za-z0-9_-]{8,40}$/;

type Row = {
  user_id: string;
  activated_at: string | null;
  seat_period_end: string | null;
  source: "wallet_capture";
  last_receipt_id: string | null;
  version: number;
};

/**
 * One redeem path for both Renoxis SKUs.
 *
 *   activate  → renoxis.activate       (one-time)   sets activated_at
 *   monthly   → renoxis.agent.monthly  (30 days)    extends seat_period_end from max(now, current end)
 *
 * Safety:
 *  - Access lives in renoxis_entitlements (service role only); customers cannot write it.
 *  - Idempotency key = user + intent + client attemptId. Retrying the SAME click reuses the key
 *    (Wallet dedupes → never charged twice); a NEW click gets a new key (never locked out).
 *  - provision() writes access inside the hold; unprovision() puts the previous row back if
 *    capture fails, then the hold is released. No access without a charge, no charge without access.
 *  - Every update is optimistic (version check) and verified to have changed exactly one row.
 */
export async function redeemSeat(intent: "activate" | "monthly", body: unknown) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email) {
    return NextResponse.json({ error: "Your account has no email — sign in with email to redeem." }, { status: 400 });
  }
  const attemptId = typeof body === "object" && body && typeof (body as { attemptId?: unknown }).attemptId === "string"
    ? (body as { attemptId: string }).attemptId
    : "";
  if (!ATTEMPT_ID.test(attemptId)) {
    return NextResponse.json({ error: "attemptId required (8–40 chars). Reload and try again." }, { status: 400 });
  }

  const productKey = intent === "activate" ? "renoxis.activate" : "renoxis.agent.monthly";
  const idempotencyKey = `rx-${intent}-${user.id.slice(0, 8)}-${attemptId}`.slice(0, 80);
  const admin = createAdminClient();

  // Snapshot before the hold so unprovision() can restore it exactly.
  const { data: before, error: readErr } = await admin
    .from("renoxis_entitlements")
    .select("user_id, activated_at, seat_period_end, source, last_receipt_id, version")
    .eq("user_id", user.id)
    .maybeSingle<Row>();
  if (readErr) return NextResponse.json({ error: "Could not read your seat. Nothing was charged." }, { status: 500 });

  try {
    const outcome = await redeem<Entitlement>({
      ownerEmail: user.email,
      productKey,
      idempotencyKey,
      provision: async (reservation) => {
        const now = new Date();
        let next: { activated_at: string | null; seat_period_end: string | null };
        if (intent === "activate") {
          if (before?.activated_at) throw new AlreadyOwned("Your activation is already on file. Use Renew for the monthly seat.");
          next = { activated_at: now.toISOString(), seat_period_end: before?.seat_period_end ?? null };
        } else {
          if (!before?.activated_at) throw new AlreadyOwned("Activate first (one-time), then renew the monthly seat.");
          const currentEnd = before.seat_period_end ? Date.parse(before.seat_period_end) : NaN;
          const base = Number.isFinite(currentEnd) && currentEnd > now.getTime() ? currentEnd : now.getTime();
          next = { activated_at: before.activated_at, seat_period_end: new Date(base + 30 * 86400_000).toISOString() };
        }

        if (before) {
          const { data: updated, error } = await admin
            .from("renoxis_entitlements")
            .update({ ...next, last_receipt_id: reservation.reservationId, version: before.version + 1, updated_at: now.toISOString() })
            .eq("user_id", user.id)
            .eq("version", before.version)
            .select("user_id");
          if (error) throw new Error(`entitlement update failed: ${error.message}`);
          if (!updated || updated.length !== 1) throw new Concurrent();
        } else {
          const { error } = await admin
            .from("renoxis_entitlements")
            .insert({ user_id: user.id, ...next, source: "wallet_capture", last_receipt_id: reservation.reservationId, version: 1 });
          if (error) throw error.code === "23505" ? new Concurrent() : new Error(`entitlement insert failed: ${error.message}`);
        }
        return { activatedAt: next.activated_at, seatPeriodEnd: next.seat_period_end, source: "wallet_capture" };
      },
      unprovision: async () => {
        // Capture failed after we wrote access: put the previous state back.
        if (before) {
          await admin.from("renoxis_entitlements")
            .update({ activated_at: before.activated_at, seat_period_end: before.seat_period_end, last_receipt_id: before.last_receipt_id, version: before.version + 2, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);
        } else {
          await admin.from("renoxis_entitlements").delete().eq("user_id", user.id);
        }
      },
    });

    if (!outcome.ok) {
      const returnUrl = `${APP_URL}/?board=Connections&billing=${intent}`;
      return NextResponse.json(
        { error: `Not enough Ixis — this is ${outcome.needed.toLocaleString()} Ixis. Buy Ixis, then come back.`, insufficient: true, buyUrl: buyIxisUrl(APP_SLUG, returnUrl) },
        { status: 402 }
      );
    }
    // Record the receipt that actually settled (the hold id was written during provision).
    await admin.from("renoxis_entitlements").update({ last_receipt_id: outcome.receiptId }).eq("user_id", user.id);
    return NextResponse.json({ success: true, receiptId: outcome.receiptId, entitlement: outcome.result });
  } catch (error) {
    if (error instanceof AlreadyOwned) return NextResponse.json({ error: error.message, alreadyOwned: true }, { status: 409 });
    if (error instanceof Concurrent) return NextResponse.json({ error: "Your seat changed while this was processing. Nothing was charged — refresh and try once more." }, { status: 409 });
    console.error(`${intent} redeem error:`, error);
    if (error instanceof WalletError) return NextResponse.json({ error: `Wallet: ${error.message}` }, { status: error.status >= 500 ? 502 : error.status });
    return NextResponse.json({ error: "Something went wrong — nothing was charged." }, { status: 500 });
  }
}

class AlreadyOwned extends Error {}
class Concurrent extends Error {}
