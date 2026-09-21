import { asOffice, storageMissing, type Office } from "@/lib/renoxis/brokerage";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function officesOf(db: SupabaseClient) {
  const { data, error } = await db.rpc("renoxis_office_snapshot");
  if (error) return { error, offices: [] as Office[] };
  const rows = Array.isArray(data) ? data : [];
  return {
    error: null,
    offices: rows.map(asOffice).filter((row): row is Office => row !== null),
  };
}

export function notReady(error: { code?: string; message?: string } | null) {
  return storageMissing(error);
}
