import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { CixyChat } from "@/components/CixyChat";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-300 dark:border-zinc-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Renoxis</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Your Real Estate Assistant</h2>
            <div className="space-y-4">
              <div className="border border-zinc-300 dark:border-zinc-700 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">Agent Office</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  30,000 Ixis/month · $300
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Full seat + 40 AI jobs per month
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Redeem · 30,000 Ixis
                </button>
              </div>

              <div className="border border-zinc-300 dark:border-zinc-700 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">Listing File</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  1,000 Ixis · $10
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Redeem · 1,000 Ixis
                </button>
              </div>

              <div className="border border-zinc-300 dark:border-zinc-700 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">Offer File</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  1,000 Ixis · $10
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Redeem · 1,000 Ixis
                </button>
              </div>
            </div>
          </div>

          <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
            <CixyChat />
          </div>
        </div>
      </main>
    </div>
  );
}
