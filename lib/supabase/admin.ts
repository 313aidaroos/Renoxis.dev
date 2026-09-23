// Server only: never import from a client component (holds the service-role key).
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Service-role client. Server only. Bypasses RLS — use for renoxis_entitlements and nothing customer-facing. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL not set");
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
