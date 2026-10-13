import { CLOSED_DEAL_FEE_BPS, JOB_IXIS } from "./pricing.ts";

/** Firm Ixis prices. Integers come from pricing.ts. SQL in supabase/brokerage.sql mirrors them. */

export const IXIS_SKU = {
  property_lookup: JOB_IXIS.propertyLookup,
  track_contact: JOB_IXIS.trackContact,
  email_draft: JOB_IXIS.email,
  offer_letter: JOB_IXIS.offerLetter,
} as const;
export type IxisSku = keyof typeof IXIS_SKU;
export const PLATFORM_COMMISSION_BPS = CLOSED_DEAL_FEE_BPS;

export function isSku(value: unknown): value is IxisSku {
  return typeof value === "string" && Object.hasOwn(IXIS_SKU, value);
}

export function skuCost(sku: IxisSku) {
  return IXIS_SKU[sku];
}

export type DebitQuote =
  | { ok: true; sku: IxisSku; cost: number; balance: number; next: number }
  | {
      ok: false;
      sku: IxisSku;
      cost: number;
      balance: number;
      shortfall: number;
    };

export function quoteDebit(balance: number, sku: IxisSku): DebitQuote {
  if (!Number.isInteger(balance) || balance < 0 || balance > 1_000_000_000)
    throw new Error("Invalid Ixis balance.");
  const cost = IXIS_SKU[sku];
  if (balance < cost)
    return { ok: false, sku, cost, balance, shortfall: cost - balance };
  return { ok: true, sku, cost, balance, next: balance - cost };
}

/** 500 bps of a closed-deal fee. Pending only: nothing is captured. */
export function platformCommission(feeBase: number) {
  if (
    typeof feeBase !== "number" ||
    !Number.isFinite(feeBase) ||
    feeBase < 0 ||
    feeBase > 1e12
  )
    throw new Error("Invalid fee base.");
  const amount = Math.round((feeBase * PLATFORM_COMMISSION_BPS) / 100) / 100;
  return {
    bps: PLATFORM_COMMISSION_BPS,
    feeBase,
    amount,
    status: "pending" as const,
  };
}
