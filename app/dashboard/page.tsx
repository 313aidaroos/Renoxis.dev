import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import CommandDesk from "@/components/CommandDesk";
import { walletEntryUrl } from "@/lib/renoxis/wallet";
import { serverEntitlement } from "@/lib/renoxis/entitlements";
import { ensureRenoxisWorldAgent } from "@/lib/renoxis/world-agent-server";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  // New accounts: create their own Apixis world agent once (idempotent), then the desk shows
  // "Your agent is ready". Runs alongside the entitlement lookup. Grok Developer Bot, 2026-09-28.
  const [entitlement, worldAgent] = await Promise.all([serverEntitlement(user), ensureRenoxisWorldAgent(user)]);
  return (
    <CommandDesk
      account={user.email ?? "Your account"}
      accountControl={<LogoutButton />}
      walletHref={walletEntryUrl(process.env.APP_URL)}
      entitlement={entitlement}
      worldAgent={worldAgent}
    />
  );
}
