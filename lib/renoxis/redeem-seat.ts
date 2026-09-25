import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WalletError, buyIxisUrl } from "@/lib/apixis-wallet";
import { walletOwner } from "@/lib/renoxis/wallet-charge";
import { purchaseSeat, type SeatIntent, type SeatStore } from "./seat-purchase";

const APP_URL = process.env.APP_URL || "https://renoxis.dev";
const ATTEMPT_ID = /^[A-Za-z0-9_-]{8,40}$/;
const problems: Record<string, string> = {
  PENDING: "Another seat payment is pending. Retry the original attempt before starting a new one.",
  RELEASED: "This attempt was released without a charge. Start a new attempt.",
  ALREADY_ACTIVATED: "Your activation is already on file. Use Renew for the monthly seat.",
  ACTIVATE_FIRST: "Activate first (one-time), then renew the monthly seat.",
};
class SeatProblem extends Error {}

export async function redeemSeat(intent: SeatIntent, body: unknown) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email || !user.email_confirmed_at) return NextResponse.json({ error: "Verify your email before redeeming." }, { status: 403 });
  const attemptId = typeof body === "object" && body && typeof (body as { attemptId?: unknown }).attemptId === "string"
    ? (body as { attemptId: string }).attemptId : "";
  if (!ATTEMPT_ID.test(attemptId)) return NextResponse.json({ error: "attemptId required (8–40 chars). Reload and try again." }, { status: 400 });

  try {
    const admin = createAdminClient();
    const args = (input: Parameters<SeatStore["stage"]>[0]) => ({ p_user_id: input.userId, p_intent: input.intent, p_attempt_id: input.attemptId, p_reservation_id: input.reservationId });
    const store: SeatStore = {
      stage: async (input) => {
        const { data, error } = await admin.rpc("renoxis_stage_seat", args(input));
        if (error) throw new Error("Could not stage seat purchase.");
        if (data?.error) throw new SeatProblem(problems[data.error] || "Seat purchase unavailable.");
        if (!data?.activatedAt) throw new Error("Invalid seat response.");
        return { activatedAt: data.activatedAt, seatPeriodEnd: data.seatPeriodEnd, source: "wallet_capture" };
      },
      settle: async (input) => {
        const { error } = await admin.rpc("renoxis_settle_seat", { ...args(input), p_captured: input.captured, p_receipt_id: input.receiptId ?? null });
        if (error) throw new Error("Could not confirm seat purchase. Retry the same attempt.");
      },
    };
    // Recover the durable attempt even after a tab is closed or browser storage is lost.
    const { data: pending, error: pendingError } = await admin.from("renoxis_seat_attempts")
      .select("attempt_id,intent").eq("user_id", user.id).eq("status", "pending").maybeSingle();
    if (pendingError) throw new Error("Could not check pending payment.");
    if (pending && pending.intent !== intent) throw new SeatProblem(`A ${pending.intent === "activate" ? "activation" : "monthly renewal"} is pending. Retry that action to confirm it first.`);
    const outcome = await purchaseSeat({ userId: user.id, owner: walletOwner(user) ?? user.email, intent, attemptId: pending?.attempt_id ?? attemptId }, store);
    if (!outcome.ok) return NextResponse.json({
      error: `Not enough Ixis — this is ${outcome.needed.toLocaleString()} Ixis. Buy Ixis, then come back.`,
      insufficient: true, retrySameAttempt: false,
      buyUrl: buyIxisUrl("renoxis", `${APP_URL}/?board=Connections&billing=${intent}`),
    }, { status: 402 });
    return NextResponse.json({ success: true, receiptId: outcome.receiptId, entitlement: outcome.result, retrySameAttempt: false });
  } catch (error) {
    if (error instanceof SeatProblem) return NextResponse.json({ error: error.message, retrySameAttempt: false }, { status: 409 });
    console.error(`${intent} seat payment requires retry:`, error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({
      error: error instanceof WalletError ? `Wallet: ${error.message}. Retry this same attempt to confirm its status.` : "Payment status could not be confirmed. Retry this same attempt; do not start another purchase.",
      retrySameAttempt: true,
    }, { status: 503 });
  }
}
