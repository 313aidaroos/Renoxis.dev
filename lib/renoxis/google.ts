import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
export function googleReady() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    /^[a-f0-9]{64}$/i.test(process.env.CONNECTION_ENCRYPTION_KEY || "") &&
    process.env.APP_URL,
  );
}
export function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export function encrypt(value: unknown) {
  const iv = randomBytes(12),
    cipher = createCipheriv(
      "aes-256-gcm",
      Buffer.from(process.env.CONNECTION_ENCRYPTION_KEY!, "hex"),
      iv,
    );
  const text = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), text]
    .map((b) => b.toString("base64url"))
    .join(".");
}
export function decrypt(text: string) {
  const [iv, tag, body] = text
    .split(".")
    .map((v) => Buffer.from(v, "base64url"));
  const cipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(process.env.CONNECTION_ENCRYPTION_KEY!, "hex"),
    iv,
  );
  cipher.setAuthTag(tag);
  return JSON.parse(
    Buffer.concat([cipher.update(body), cipher.final()]).toString(),
  );
}
export async function connection(userId: string) {
  if (!googleReady()) return null;
  const { data, error } = await admin()
    .from("renoxis_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Connection storage unavailable.");
  return data;
}
export async function accessToken(userId: string) {
  const row = await connection(userId);
  if (!row) throw new Error("Connect Google in Connections first.");
  const token = decrypt(row.encrypted_tokens);
  if (token.expires_at > Date.now() + 60000)
    return token.access_token as string;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15000),
  });
  const next = await res.json();
  if (!res.ok)
    throw new Error(
      "Google access expired or was revoked. Reconnect in Connections.",
    );
  const { error } = await admin()
    .from("renoxis_connections")
    .update({
      encrypted_tokens: encrypt({
        ...token,
        ...next,
        expires_at: Date.now() + next.expires_in * 1000,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw new Error("Could not refresh connection.");
  return next.access_token as string;
}
export async function googleFetch(
  userId: string,
  path: string,
  init: RequestInit = {},
) {
  const token = await accessToken(userId);
  const response = await fetch("https://www.googleapis.com/" + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      response.status === 403
        ? "Google permission denied. Check granted scopes in Connections."
        : "Google request failed. Please reconnect or retry.",
    );
  return response.json();
}
