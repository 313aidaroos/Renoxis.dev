import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import CommandDesk from "@/components/CommandDesk";
import { walletEntryUrl } from "@/lib/renoxis/wallet";
import { serverEntitlement } from "@/lib/renoxis/entitlements";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return (
    <CommandDesk
      account={user.email ?? "Your account"}
      accountControl={<LogoutButton />}
      walletHref={walletEntryUrl(process.env.APP_URL)}
      entitlement={await serverEntitlement(user)}
    />
  );
}
