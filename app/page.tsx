import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";
import { LogoutButton } from "@/components/LogoutButton";
import CommandDesk from "@/components/CommandDesk";

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
    />
  );
}
