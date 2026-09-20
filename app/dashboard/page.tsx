import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import CommandDesk from "@/components/CommandDesk";
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
    />
  );
}
