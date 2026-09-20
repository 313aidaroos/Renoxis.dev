"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <><button disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      // A full navigation discards private customer state held in client components.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch { setError("Could not sign out. Please retry."); setBusy(false); }
  }}>{busy ? "Signing out…" : "Sign out"}</button>{error && <p role="alert">{error}</p>}</>;
}
