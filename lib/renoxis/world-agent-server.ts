// Server only (service-role key + APIXIS_WORLD_KEY). Wires lib/renoxis/world-agent.ts to Supabase
// auth (app_metadata) and Apixis.dev POST /api/agent/provision. Grok Developer Bot, 2026-09-28.
import type { User } from "@supabase/supabase-js";
import { provisionApixisWorldAgent } from "@/lib/apixis-world-provision";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureWorldAgent, type WorldAgentView } from "@/lib/renoxis/world-agent";

export async function saveUserAppMetadata(userId: string, appMetadata: Record<string, unknown>) {
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, { app_metadata: appMetadata });
  if (error) throw error;
}

export function ensureRenoxisWorldAgent(user: User): Promise<WorldAgentView> {
  return ensureWorldAgent(user, {
    provision: (input) => provisionApixisWorldAgent({ ...input, emailVerified: true, timeoutMs: 6000 }),
    saveAppMetadata: saveUserAppMetadata,
  });
}
