import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redeem, WalletError, buyIxisUrl } from "@/lib/apixis-wallet";
import type { Entitlement } from "@/lib/renoxis/billing";

const APP_SLUG = "renoxis";
const APP_URL = process.env.APP_URL || "https://renoxis.vercel.app";

/**
 * One redeem path for both Renoxis SKUs. The Wallet is the source of truth (it writes an
 * entitlement on capture); renoxis_records kind='entitlement' is our cache for fast gating.
 *
 *   activate  → renoxis.activate       (one-time)   sets activatedAt
 *   monthly   → renoxis.agent.monthly  (30 days)    extends seatPeriodEnd from max(now, current end)
 *
 * Reserve → provision (write cache) → capture; released on ANY failure, so a customer is
 * never charged without the seat being recorded.
 */
export async function redeemSeat(intent: "activate" | "monthly") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email) {
    return NextResponse.json({ error: "Your account has no email — sign in with email to redeem." }, { status: 400 });
  }

  const productKey = intent === "activate" ? "renoxis.activate" : "renoxis.agent.monthly";
  // Fresh key per attempt: a released hold must never block a later retry.
  const idempotencyKey = `renoxis-${user.id}-${intent}-${Date.now()}`;

  try {
    const outcome = await redeem({
      ownerEmail: user.email, // family identity is the verified email, not this project's uid
      productKey,
      idempotencyKey,
      provision: async () => {
        const now = new Date();
        const { data: existing, error: fetchErr } = await supabase
          .from("renoxis_records")
          .select("id, data, version")
          .eq("user_id", user.id)
          .eq("kind", "entitlement")
          .maybeSingle();
        if (fetchErr) throw new Error("Database error reading entitlement");

        const prev = (existing?.data ?? {}) as Partial<Entitlement>;
        let next: Entitlement;
        if (intent === "activate") {
          if (prev.source === "wallet_capture" && prev.activatedAt) {
            // Already activated: don't charge 5,000 Ixis twice for the same thing.
            throw new AlreadyOwned("Your activation is already on file. Use Renew for the monthly seat.");
          }
          next = { activatedAt: now.toISOString(), seatPeriodEnd: prev.seatPeriodEnd ?? null, source: "wallet_capture" };
        } else {
          if (!prev.activatedAt) throw new AlreadyOwned("Activate first (one-time), then renew the monthly seat.");
          const currentEnd = prev.seatPeriodEnd ? Date.parse(prev.seatPeriodEnd) : NaN;
          const base = Number.isFinite(currentEnd) && currentEnd > now.getTime() ? currentEnd : now.getTime();
          next = { activatedAt: prev.activatedAt, seatPeriodEnd: new Date(base + 30 * 86400_000).toISOString(), source: "wallet_capture" };
        }

        const write = existing
          ? await supabase.from("renoxis_records")
              .update({ data: next, version: existing.version + 1, updated_at: now.toISOString() })
              .eq("id", existing.id).eq("version", existing.version)
          : await supabase.from("renoxis_records")
              .insert({ user_id: user.id, kind: "entitlement", data: next, version: 1 });
        if (write.error) throw new Error("Failed to record entitlement");
        return next;
      },
    });

    if (!outcome.ok) {
      const returnUrl = `${APP_URL}/?board=Connections&billing=${intent}`;
      return NextResponse.json(
        {
          error: `Not enough Ixis — this is ${outcome.needed.toLocaleString()} Ixis. Buy Ixis, then come back.`,
          insufficient: true,
          buyUrl: buyIxisUrl(APP_SLUG, returnUrl),
        },
        { status: 402 }
      );
    }
    return NextResponse.json({ success: true, receiptId: outcome.receiptId, entitlement: outcome.result });
  } catch (error) {
    if (error instanceof AlreadyOwned) {
      // Hold was released by redeem(); nothing charged.
      return NextResponse.json({ error: error.message, alreadyOwned: true }, { status: 409 });
    }
    console.error(`${intent} redeem error:`, error);
    if (error instanceof WalletError) {
      return NextResponse.json({ error: `Wallet: ${error.message}` }, { status: error.status >= 500 ? 502 : error.status });
    }
    return NextResponse.json({ error: "Something went wrong — nothing was charged." }, { status: 500 });
  }
}

class AlreadyOwned extends Error {}
