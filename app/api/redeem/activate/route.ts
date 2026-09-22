import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redeem, WalletError, buyIxisUrl } from "@/lib/apixis-wallet";

const PRODUCT_KEY = "renoxis.activate";
const APP_SLUG = "renoxis";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fresh key per attempt: reserve is idempotent on this key, so a hold that was released
    // (provision failed, wallet hiccup) must not block the customer from ever retrying.
    const idempotencyKey = `renoxis-${user.id}-activate-${Date.now()}`;
    const now = new Date().toISOString();

    if (!user.email) return NextResponse.json({ error: "Your account has no email — sign in with email to redeem." }, { status: 400 });
    const outcome = await redeem({
      ownerEmail: user.email, // family identity is the verified email, not this project's uid
      productKey: PRODUCT_KEY,
      idempotencyKey,
      provision: async () => {
        // Provision: mark seat active in renoxis_records
        const { data: existing, error: fetchErr } = await supabase
          .from("renoxis_records")
          .select("id, data, version")
          .eq("user_id", user.id)
          .eq("kind", "entitlement")
          .single();

        if (fetchErr && fetchErr.code !== "PGRST116") {
          throw new Error("Database error reading entitlement");
        }

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

          if (error) throw new Error("Failed to update entitlement");
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

          if (error) throw new Error("Failed to create entitlement");
        }

        return { activatedAt: now };
      },
    });

    if (!outcome.ok) {
      const appUrl = process.env.APP_URL || "https://renoxis.vercel.app";
      const returnUrl = `${appUrl}/?board=Connections&billing=activate`;
      return NextResponse.json(
        {
          error: "Not enough Ixis. Buy more on Apixis Wallet.",
          insufficient: true,
          buyUrl: buyIxisUrl(APP_SLUG, returnUrl),
        },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      receiptId: outcome.receiptId,
      activated: outcome.result.activatedAt,
    });
  } catch (error) {
    console.error("Activate redeem error:", error);
    if (error instanceof WalletError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
