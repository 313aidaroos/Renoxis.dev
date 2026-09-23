import { redeemSeat } from "@/lib/renoxis/redeem-seat";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return redeemSeat("activate", body);
}
