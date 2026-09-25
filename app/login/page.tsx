"use client";

import { safeLocalRedirect } from "@/lib/apixis-redirect";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const [tab, setTab] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeLocalRedirect(searchParams.get("next"));

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
      callbackUrl.searchParams.set("next", next);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl.toString() },
      });
      
      setMessage(error ? error.message : "Check your email for the sign-in link!");
    } catch {
      setMessage("Unable to connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
      } else {
        router.push(next);
      }
    } catch {
      setMessage("Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Renoxis</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Real Estate Personal Assistant
          </p>
        </div>

        <a
          href={`/auth/apixis/start?next=${encodeURIComponent(next)}`}
          className="block w-full text-center bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          Sign in with Apixis
        </a>
        <p className="text-center text-xs text-zinc-500">One Apixis account for every family site. Or use email below.</p>

        <div className="flex border-b border-zinc-300 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setTab("magic")}
            className={`flex-1 pb-2 font-bold ${
              tab === "magic"
                ? "border-b-2 border-emerald-700 text-emerald-700"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Email link
          </button>
          <button
            type="button"
            onClick={() => setTab("password")}
            className={`flex-1 pb-2 font-bold ${
              tab === "password"
                ? "border-b-2 border-emerald-700 text-emerald-700"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Password
          </button>
        </div>

        {tab === "magic" ? (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              {loading ? "Sending..." : "Email me a sign-in link"}
            </button>

            {message && (
              <p
                className={`text-sm text-center ${
                  message.includes("Check") ? "text-green-600" : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label htmlFor="email-pwd" className="block text-sm font-bold mb-2">
                Email
              </label>
              <input
                id="email-pwd"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
                placeholder="Your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {message && (
              <p className="text-sm text-center text-red-600">{message}</p>
            )}
          </form>
        )}

        <p className="text-center text-sm">
          <Link href="/privacy" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            Terms
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
