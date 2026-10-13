import type { User } from "@supabase/supabase-js";
import { walletBalance, WalletError } from "@/lib/apixis-wallet";
import { createAdminClient } from "@/lib/supabase/admin";
import { IXIS_SKU, type IxisSku } from "@/lib/renoxis/ixis";
import { jobPayer } from "@/lib/renoxis/office-access";
import { walletBuyUrl } from "@/lib/renoxis/wallet-link";
import { chargeFromWallet, walletOwner, type WalletCharge } from "@/lib/renoxis/wallet-charge";

/** Buy Ixis and return to the Brokerage tab. Same Wallet link the rest of the app uses. */
export function officeBuyUrl() {
  const url = new URL("https://renoxis.dev/");
  url.searchParams.set("board", "Brokerage");
  return walletBuyUrl(url.toString());
}

/** The office Wallet is the active owner's Apixis Wallet (their id, or their email). */
export async function resolveOfficeWalletOwner(brokerageId: string) {
  const admin = createAdminClient();
  const { data: owner, error } = await admin
    .from("brokerage_members")
    .select("user_id,email")
    .eq("brokerage_id", brokerageId)
    .eq("role", "owner")
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !owner?.user_id) return null;
  const lookedUp = await admin.auth.admin.getUserById(owner.user_id);
  const payer = lookedUp.data?.user ? walletOwner(lookedUp.data.user) : null;
  if (payer) return payer;
  const email = typeof owner.email === "string" ? owner.email.trim().toLowerCase() : "";
  if (email.includes("@") && !email.endsWith(".invalid")) return email;
  return null;
}

export async function officeWalletBalance(payer: string) {
  try {
    const balance = await walletBalance(payer);
    return typeof balance.available === "number" ? balance.available : null;
  } catch (error) {
    if (error instanceof WalletError) return null;
    return null;
  }
}

async function recordOfficeSpend(input: {
  brokerageId: string;
  sku: IxisSku;
  cost: number;
  actorUserId: string;
  ref: string;
}) {
  if (input.cost <= 0) return;
  const admin = createAdminClient();
  const { error } = await admin.from("brokerage_ixis_ledger").insert({
    brokerage_id: input.brokerageId,
    sku: input.sku,
    amount_ixis: -input.cost,
    actor_user_id: input.actorUserId,
    ref: input.ref,
  });
  if (error && error.code !== "23505") {
    console.error("Office spend was charged but not listed:", error.message);
  }
}

/**
 * Bill a Cixy job to the office Wallet. Never falls back to the person who clicked.
 * A platform admin who is signed in is still not charged (owners.ts).
 */
export async function chargeOfficeJob<T>(input: {
  actor: User;
  sku: IxisSku;
  ref: string;
  brokerageId: string;
  provision: () => Promise<T>;
  unprovision?: (result: T) => Promise<void>;
}): Promise<WalletCharge<T> & { billedToOffice: true }> {
  let officeOwner: string | null = null;
  try {
    officeOwner = await resolveOfficeWalletOwner(input.brokerageId);
  } catch {
    return {
      ok: false,
      status: 503,
      billedToOffice: true,
      body: { error: "The office Wallet is not available yet.", billedToOffice: true },
    };
  }
  const decision = jobPayer({
    inBrokerage: true,
    actorPayer: walletOwner(input.actor) ?? input.actor.email ?? "",
    officeWalletOwner: officeOwner,
  });
  if (decision.kind !== "office") {
    return {
      ok: false,
      status: 409,
      billedToOffice: true,
      body: { error: decision.kind === "blocked" ? decision.reason : "The office Wallet could not be charged.", billedToOffice: true },
    };
  }
  const charge = await chargeFromWallet(
    input.actor,
    input.sku,
    input.ref,
    input.provision,
    input.unprovision,
    decision.payer,
  );
  if (charge.ok && charge.cost > 0) {
    await recordOfficeSpend({
      brokerageId: input.brokerageId,
      sku: input.sku,
      cost: charge.cost,
      actorUserId: input.actor.id,
      ref: input.ref,
    });
  }
  if (!charge.ok) return { ...charge, billedToOffice: true };
  return { ...charge, billedToOffice: true };
}

export function catalogCost(sku: IxisSku) {
  return IXIS_SKU[sku];
}
