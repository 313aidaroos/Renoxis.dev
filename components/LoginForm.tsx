"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link!");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
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
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-8 rounded-lg transition-colors"
      >
        {loading ? "Sending..." : "Send Magic Link"}
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
  );
}
