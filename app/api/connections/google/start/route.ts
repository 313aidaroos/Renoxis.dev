import { session, json, failure } from "@/lib/renoxis/http";
import { googleReady, encrypt } from "@/lib/renoxis/google";
import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  try {
    const { user } = await session(request);
    if (!googleReady())
      return json(
        {
          error:
            "Google setup is pending: the site owner must configure OAuth credentials and encryption.",
        },
        503,
      );
    const state = randomBytes(32).toString("base64url"),
      verifier = randomBytes(48).toString("base64url");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.APP_URL + "/api/connections/google/callback",
      response_type: "code",
      scope:
        "openid email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events",
      access_type: "offline",
      prompt: "consent",
      state,
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256",
    }).toString();
    const response = NextResponse.json(
      { url: url.href },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(
      "renoxis-google",
      encrypt({
        state,
        verifier,
        userId: user.id,
        expires: Date.now() + 600000,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/connections/google",
        maxAge: 600,
      },
    );
    return response;
  } catch (e) {
    return failure(e);
  }
}
