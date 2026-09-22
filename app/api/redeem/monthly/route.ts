import { redeemSeat } from "@/lib/renoxis/redeem-seat";

export async function POST() {
  return redeemSeat("monthly");
}
