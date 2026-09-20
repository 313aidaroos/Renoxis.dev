import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ListingForm } from "@/components/ListingForm";

export default async function ListingGenerator() {
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
          <Link href="/dashboard" className="text-2xl font-bold hover:text-blue-600">
            Renoxis
          </Link>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.email}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Listing Copy Generator</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Draft listing copy with AI. Review accuracy and applicable requirements before publishing.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Wallet billing is not connected. No Ixis charge is made by this page.
            </p>
          </div>

          <ListingForm />
        </div>
      </main>
    </div>
  );
}
