import type { User } from "@supabase/supabase-js";
import { redeem, WalletError } from "@/lib/apixis-wallet";
import { apixisSubOf } from "@/lib/apixis-login";
import { IXIS_SKU, type IxisSku } from "./ixis";
import { walletEntryUrl } from "./wallet";
import { isOwner } from "./owners";

export type WalletCharge<T> =
  | { ok: true; result: T; receiptId: string | null; cost: number }
  | { ok: false; status: number; body: Record<string, unknown> };

/** Who pays: the Apixis ID `sub` saved at "Sign in with Apixis", else the verified email. */
export function walletOwner(user: Pick<User, "email" | "app_metadata">): string | null {
  return apixisSubOf(user) ?? user.email ?? null;
}

/**
 * Pay for a Renoxis action from one Apixis Wallet.
 * Pass `payer` (the office owner's Apixis id or email) to bill that Wallet instead of the person
 * who clicked. `provision` writes the result while the Ixis are held; `unprovision` undoes it if
 * the Wallet confirms the charge did not go through. Free SKUs skip the Wallet entirely.
 */
export async function chargeFromWallet<T>(
  user: Pick<User, "email" | "app_metadata"> & { email_confirmed_at?: string | null },
  sku: IxisSku,
  ref: string,
  provision: () => Promise<T>,
  unprovision?: (result: T) => Promise<void>,
  payer?: string | null,
): Promise<WalletCharge<T>> {
  const cost = IXIS_SKU[sku];
  if (cost === 0) return { ok: true, result: await provision(), receiptId: null, cost };
  // Owner bypass (owners.ts): the signed-in platform admin is not charged. The Wallet is not called.
  if (isOwner(user)) return { ok: true, result: await provision(), receiptId: null, cost: 0 };
  const officeBill = Boolean(payer);
  const owner = payer || walletOwner(user);
  if (!owner)
    return {
      ok: false,
      status: 400,
      body: {
        error: officeBill
          ? "This brokerage has no office Wallet yet. The owner needs to sign in with Apixis."
          : "Sign in with Apixis to spend Ixis.",
      },
    };
  try {
    const outcome = await redeem<T>({
      owner,
      productKey: `renoxis.${sku}`,
      idempotencyKey: `rx-${sku}-${ref}`.slice(0, 80),
      provision: async () => provision(),
      unprovision: unprovision ? async (_hold, result) => unprovision(result) : undefined,
    });
    if (!outcome.ok) {
      return {
        ok: false,
        status: 402,
        body: {
          error: officeBill
            ? `This costs ${cost} Ixis and the office Wallet doesn't have enough. An owner can add Ixis on Apixis Wallet.`
            : `This costs ${cost} Ixis and your Apixis Wallet doesn't have enough. Buy Ixis and you'll come straight back.`,
          cost,
          buy: walletEntryUrl(process.env.APP_URL),
          billedToOffice: officeBill,
        },
      };
    }
    return { ok: true, result: outcome.result, receiptId: outcome.receiptId, cost };
  } catch (e) {
    if (e instanceof WalletError) {
      return { ok: false, status: e.status >= 500 ? 503 : e.status, body: { error: e.message, cost } };
    }
    throw e;
  }
}
