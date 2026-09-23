"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function SetPasswordContent() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
        data: { has_password: true },
      });

      if (error) {
        setMessage(error.message);
      } else {
        router.push(next);
      }
    } catch {
      setMessage("Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push(next);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Choose a password</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Next time you sign in without waiting for an email.
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-bold mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
              placeholder="At least 8 characters"
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            {loading ? "Saving..." : "Set password"}
          </button>

          {message && (
            <p className="text-sm text-center text-red-600">{message}</p>
          )}

          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 py-2"
          >
            Skip for now →
          </button>
        </form>
      </div>
    </main>
  );
}

export default function SetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SetPasswordContent />
    </Suspense>
  );
}
