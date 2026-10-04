import { enterApixisUrl } from "../apixis-world.ts";

/**
 * Renoxis → Apixis world entry. Every Renoxis account gets its own Apixis world agent (Cixy stays
 * the guide, not the user's avatar). Apixis.dev handles sign-in (Apixis ID), agent creation and the
 * 1000 starter Ixis. Since 2026-09-28 new accounts get that agent created server-side at signup
 * (lib/renoxis/world-agent.ts) and see a "Your agent is ready" card; no redirect mid-onboarding.
 * Older accounts keep the one-time per-browser prompt below, and everyone keeps the sidebar link.
 */
export const RENOXIS_APIXIS_WORLD_URL = enterApixisUrl("renoxis");

const SEEN_PREFIX = "renoxis-apixis-world-prompt-v1:";

/** Per-account localStorage key (same per-account pattern as the Cixy prefs key). */
export function apixisPromptSeenKey(account: string): string {
  return SEEN_PREFIX + String(account ?? "").trim().toLowerCase();
}

/** True when this account has not been shown the first-run prompt yet. */
export function shouldShowApixisPrompt(storedValue: string | null | undefined): boolean {
  return !storedValue;
}
