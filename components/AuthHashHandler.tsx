"use client";
import { safeLocalRedirect } from "@/lib/apixis-redirect";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase magic links (implicit flow) return to the site root with tokens in the URL hash.
 * Before the welcome page, CommandDesk mounted on "/" and its browser client consumed the hash.
 * The welcome page mounts no Supabase client for anonymous visitors, so every sign-in landed
 * on the welcome page and the tokens were silently dropped (verified live on renoxis.dev).
 * This runs on "/", finishes the session, scrubs the URL and moves the user to the dashboard.
 */
export default function AuthHashHandler({ destination }: { destination: string }) {
  const router = useRouter();
  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return;
    const hash = new URLSearchParams(raw);
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    const error = hash.get("error_description");
    if (error) {
      window.history.replaceState(null, "", window.location.pathname);
      router.replace(`/auth/error?reason=${encodeURIComponent(error)}`);
      return;
    }
    if (!access_token || !refresh_token) return;
    (async () => {
      const supabase = createClient();
      const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
      window.history.replaceState(null, "", window.location.pathname);
      if (setErr) { router.replace("/auth/error"); return; }
      router.replace(safeLocalRedirect(destination, "/dashboard"));
      router.refresh();
    })();
  }, [destination, router]);
  return null;
}
