/** Firm Ixis prices. The same integers are enforced in supabase/brokerage.sql. */
export const IXIS_SKU = {
  property_lookup: 25,
  track_contact: 0,
  email_draft: 50,
  offer_letter: 100,
} as const;
export type IxisSku = keyof typeof IXIS_SKU;
export const PLATFORM_COMMISSION_BPS = 500;

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
    throw new Error("Invalid office balance.");
  const cost = IXIS_SKU[sku];
  if (balance < cost)
    return { ok: false, sku, cost, balance, shortfall: cost - balance };
  return { ok: true, sku, cost, balance, next: balance - cost };
}

export function insufficientMessage(cost: number, balance: number | null) {
  if (balance === null)
    return `The office does not have enough Ixis for this action (${cost}). Billed to office. Wallet top-up is not connected.`;
  return `The office has ${balance} Ixis. This action costs ${cost}. Wallet top-up is not connected.`;
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
