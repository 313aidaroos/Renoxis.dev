import { json } from "@/lib/renoxis/http";

/**
 * Office grants are retired: Renoxis no longer keeps its own Ixis balance. Every paid action is
 * paid from the person's one Apixis Wallet (see lib/renoxis/wallet-charge.ts).
 */
export async function POST() {
  return json(
    { error: "Office grants are retired. Everyone spends from their own Apixis Wallet — use Buy Ixis." },
    410,
  );
}
