// POST /api/apixis/world-welcome { action: "enter" | "dismiss" } — hides the one-time
// "Your agent is ready" card for this account on every device. Grok Developer Bot, 2026-09-28.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { welcomeSeenMetadata } from "@/lib/renoxis/world-agent";
import { saveUserAppMetadata } from "@/lib/renoxis/world-agent-server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const action = body?.action === "enter" ? "enter" : "dismiss";
  try {
    await saveUserAppMetadata(user.id, welcomeSeenMetadata(user.app_metadata, action));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
