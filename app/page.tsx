import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold">Renoxis</h1>
            <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400">
              Welcome, {user.email}
            </p>
          </div>

          <div className="text-center mt-12 space-y-4">
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold">Renoxis</h1>
          <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400">
            Real Estate Personal Assistant
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="border border-zinc-300 dark:border-zinc-700 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">For Agents</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Generate listing copy, draft offers, and manage your workflow with AI.
            </p>
          </div>

          <div className="border border-zinc-300 dark:border-zinc-700 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">For Buyers</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Schedule showings, analyze comps, and get expert guidance.
            </p>
          </div>

          <div className="border border-zinc-300 dark:border-zinc-700 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">For Sellers</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Create compelling listings and communicate effectively with buyers.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-6">Get Started</h2>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
