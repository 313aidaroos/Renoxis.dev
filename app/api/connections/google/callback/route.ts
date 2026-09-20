import { session } from "@/lib/renoxis/http";
import { admin, encrypt, decrypt } from "@/lib/renoxis/google";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const base = process.env.APP_URL || new URL(request.url).origin;
  let ok = false;
  try {
    const { user } = await session();
    const params = new URL(request.url).searchParams;
    const raw = (await cookies()).get("renoxis-google")?.value;
    if (!raw || params.has("error")) throw new Error();
    const state = decrypt(raw);
    if (
      state.userId !== user.id ||
      state.state !== params.get("state") ||
      state.expires < Date.now() ||
      !params.get("code")
    )
      throw new Error();
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code: params.get("code")!,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: base + "/api/connections/google/callback",
        grant_type: "authorization_code",
        code_verifier: state.verifier,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const token = await res.json();
    if (!res.ok || !token.refresh_token) throw new Error();
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${token.access_token}` },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!profileResponse.ok) throw new Error();
    const profile = await profileResponse.json();
    if (!profile.email) throw new Error();
    const { error } = await admin()
      .from("renoxis_connections")
      .upsert({
        user_id: user.id,
        email: profile.email,
        scopes: token.scope || "",
        encrypted_tokens: encrypt({
          ...token,
          expires_at: Date.now() + token.expires_in * 1000,
        }),
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
    ok = true;
  } catch {
    /* Do not expose provider responses, codes or tokens. */
  }
  const response = NextResponse.redirect(
    base + "/?board=Connections&connection=" + (ok ? "connected" : "failed"),
  );
  response.cookies.set("renoxis-google", "", {
    path: "/api/connections/google",
    maxAge: 0,
  });
  return response;
}
