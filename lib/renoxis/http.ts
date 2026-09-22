import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function session(request?: Request) {
  if (request && !["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      let source: URL;
      try { source = new URL(origin); } catch { throw new Error("ORIGIN"); }
      const host = request.headers.get("host") || new URL(request.url).host;
      if (!["https:", "http:"].includes(source.protocol) || source.host !== host) throw new Error("ORIGIN");
    }
  }
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("AUTH");
  return { db, user };
}
export async function body(request: Request) {
  const text = await request.text();
  if (text.length > 50000) throw new Error("Request too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON.");
  }
}
export function failure(e: unknown) {
  const message = e instanceof Error ? e.message : "Request failed.";
  if (message === "AUTH")
    return json({ error: "Sign in to use your workspace." }, 401);
  if (message === "ORIGIN")
    return json({ error: "Request origin is not allowed." }, 403);
  if (message === "ENTITLEMENT")
    return json(
      {
        error:
          "Activate or renew your Renoxis seat. Access unlocks after Wallet capture or an admin beta grant.",
      },
      402,
    );
  return json({ error: message }, 400);
}
