import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WALLET_SKU, redeemIdempotencyKey } from "@/lib/renoxis/billing";

const WALLET_API_URL = "https://apixis-wallet.vercel.app/api/v1";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const WALLET_API_KEY = process.env.WALLET_API_KEY;
    if (!WALLET_API_KEY) {
      return NextResponse.json(
        { error: "Wallet integration not configured" },
        { status: 503 }
      );
    }

    const idempotencyKey = redeemIdempotencyKey(user.id, "activate");

    // 1. Quote
    const quoteRes = await fetch(`${WALLET_API_URL}/quotes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WALLET_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        owner_id: user.id,
        sku: WALLET_SKU.activate,
      }),
    });

    if (!quoteRes.ok) {
      const error = await quoteRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || "Failed to quote" },
        { status: quoteRes.status }
      );
    }

    const quote = await quoteRes.json();

    // 2. Reserve
    const reserveRes = await fetch(`${WALLET_API_URL}/reservations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WALLET_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        owner_id: user.id,
        sku: WALLET_SKU.activate,
        amount: quote.amount || 5000,
      }),
    });

    if (!reserveRes.ok) {
      const error = await reserveRes.json().catch(() => ({}));
      if (reserveRes.status === 402) {
        return NextResponse.json(
          { error: "Not enough Ixis. Buy more on Apixis Wallet.", insufficient: true },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: error.error || "Failed to reserve" },
        { status: reserveRes.status }
      );
    }

    const reservation = await reserveRes.json();
    const reservationId = reservation.id;

    try {
      // 3. Provision entitlement
      const now = new Date().toISOString();
      const { data: existing, error: fetchErr } = await supabase
        .from("renoxis_records")
        .select("id, data, version")
        .eq("user_id", user.id)
        .eq("kind", "entitlement")
        .single();

      if (fetchErr && fetchErr.code !== "PGRST116") {
        throw new Error("Database error reading entitlement");
      }

      let provisionErr;
      if (existing) {
        const { error } = await supabase
          .from("renoxis_records")
          .update({
            data: {
              activatedAt: now,
              seatPeriodEnd: null,
              source: "wallet_capture",
            },
            version: existing.version + 1,
            updated_at: now,
          })
          .eq("id", existing.id)
          .eq("version", existing.version);
        provisionErr = error;
      } else {
        const { error } = await supabase.from("renoxis_records").insert({
          user_id: user.id,
          kind: "entitlement",
          data: {
            activatedAt: now,
            seatPeriodEnd: null,
            source: "wallet_capture",
          },
          version: 1,
        });
        provisionErr = error;
      }

      if (provisionErr) {
        throw new Error("Failed to provision entitlement");
      }

      // 4. Capture
      const captureRes = await fetch(
        `${WALLET_API_URL}/reservations/${reservationId}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WALLET_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!captureRes.ok) {
        // Rollback entitlement on capture failure
        if (existing) {
          await supabase
            .from("renoxis_records")
            .update({
              data: existing.data,
              version: existing.version + 2,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("renoxis_records")
            .delete()
            .eq("user_id", user.id)
            .eq("kind", "entitlement");
        }

        const releaseRes = await fetch(
          `${WALLET_API_URL}/reservations/${reservationId}/release`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WALLET_API_KEY}`,
            },
          }
        );

        return NextResponse.json(
          { error: "Capture failed, reservation released" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, activated: now });
    } catch (provisionError) {
      // Release on provision failure
      await fetch(`${WALLET_API_URL}/reservations/${reservationId}/release`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WALLET_API_KEY}`,
        },
      });

      return NextResponse.json(
        { error: "Provisioning failed, reservation released" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Activate redeem error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
