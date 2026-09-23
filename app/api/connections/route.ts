import { session, json, failure } from "@/lib/renoxis/http";
import { googleReady, connection, admin, decrypt } from "@/lib/renoxis/google";
let aiHealth: { ok: boolean; at: number } | null = null;
/** Cheap authenticated call to Anthropic; cached 5 min per server instance. */
async function anthropicHealthy(): Promise<boolean> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return false;
  if (aiHealth && Date.now() - aiHealth.at < 5 * 60_000) return aiHealth.ok;
  try {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    aiHealth = { ok: res.ok, at: Date.now() };
  } catch {
    aiHealth = { ok: false, at: Date.now() };
  }
  return aiHealth.ok;
}

export async function GET() {
  try {
    const { db, user } = await session();
    const { error } = await db.from("renoxis_records").select("id").limit(1);
    const c = await connection(user.id);
    return json({
      storage: !error,
      // "Ready" means a real round-trip succeeded, not that a key string exists.
      ai: await anthropicHealthy(),
      google: {
        configured: googleReady(),
        connected: !!c,
        email: c?.email || null,
        scopes: c?.scopes || "",
      },
      wallet: false, // Buy Ixis is an outbound link. This app does not read Wallet balances.
    });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { user } = await session(request);
    const c = await connection(user.id);
    if (c) {
      const token = decrypt(c.encrypted_tokens);
      const res = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: token.refresh_token || token.access_token,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok && res.status !== 400)
        throw new Error(
          "Google revocation failed. Retry or revoke access in your Google account.",
        );
      const { error } = await admin()
        .from("renoxis_connections")
        .delete()
        .eq("user_id", user.id);
      if (error) throw new Error("Could not remove the connection.");
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
