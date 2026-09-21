import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";
import { LogoutButton } from "@/components/LogoutButton";
import CommandDesk from "@/components/CommandDesk";
import { walletEntryUrl } from "@/lib/renoxis/wallet";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <CommandDesk
      preview={!user}
      account={user?.email ?? "Your account"}
      accountControl={user ? <LogoutButton /> : undefined}
      loginForm={<LoginForm />}
      walletHref={walletEntryUrl(process.env.APP_URL)}
    />
  );
}
