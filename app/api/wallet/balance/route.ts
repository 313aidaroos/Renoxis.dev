import { walletBalance, WalletError } from "@/lib/apixis-wallet";
import { failure, json, session } from "@/lib/renoxis/http";
import { walletOwner } from "@/lib/renoxis/wallet-charge";
import { walletEntryUrl } from "@/lib/renoxis/wallet";

/** The signed-in person's one Apixis Wallet balance, for the Renoxis header / Team board. */
export async function GET() {
  try {
    const { user } = await session();
    const owner = walletOwner(user);
    const buy = walletEntryUrl(process.env.APP_URL);
    if (!owner) return json({ available: null, buy });
    try {
      const balance = await walletBalance(owner, { history: 10 });
      return json({ ...balance, buy });
    } catch (e) {
      if (e instanceof WalletError && (e.status === 403 || e.status === 404)) return json({ available: null, buy, signInWithApixis: true });
      return json({ available: null, buy, error: "Apixis Wallet is unreachable right now." }, 503);
    }
  } catch (e) {
    return failure(e);
  }
}
