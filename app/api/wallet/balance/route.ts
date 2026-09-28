import { walletBalance, WalletError } from "@/lib/apixis-wallet";
import { apixisSubOf } from "@/lib/apixis-login";
import { failure, json, session } from "@/lib/renoxis/http";
import { walletOwner } from "@/lib/renoxis/wallet-charge";
import { walletEntryUrl } from "@/lib/renoxis/wallet";

/**
 * The signed-in person's one Apixis Wallet balance, for the Renoxis header pill / desk / Team board.
 * `linked` = the account signed in with Apixis ID (owner is the Apixis `sub`); otherwise the
 * verified email is used and the header offers "Sign in with Apixis".
 */
export async function GET() {
  try {
    const { user } = await session();
    const owner = walletOwner(user);
    const linked = Boolean(apixisSubOf(user));
    const buy = walletEntryUrl(process.env.APP_URL);
    if (!owner) return json({ available: null, linked, buy });
    try {
      const balance = await walletBalance(owner, { history: 10 });
      return json({ ...balance, linked, buy });
    } catch (e) {
      if (e instanceof WalletError && (e.status === 403 || e.status === 404)) return json({ available: null, linked: false, buy, signInWithApixis: true });
      return json({ available: null, linked, buy, error: "Apixis Wallet is unreachable right now." }, 503);
    }
  } catch (e) {
    return failure(e);
  }
}
