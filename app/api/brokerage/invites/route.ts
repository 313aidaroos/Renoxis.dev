import { canInvite, isRole } from "@/lib/renoxis/access";
import { inviteEmail, isUuid } from "@/lib/renoxis/brokerage";
import { notReady, officesOf } from "@/lib/renoxis/firm-store";
import { body, failure, json, session } from "@/lib/renoxis/http";
import { createHash, randomBytes } from "node:crypto";

export async function POST(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    if (!isUuid(input.brokerageId) || !isRole(input.role))
      throw new Error("Choose an office and a role.");
    const email = inviteEmail(input.email);
    const loaded = await officesOf(db);
    if (notReady(loaded.error))
      return json({ error: "Team storage is not ready yet." }, 503);
    const office = loaded.offices.find((row) => row.id === input.brokerageId);
    if (!office)
      return json({ error: "You are not an active member of this office." }, 403);
    if (!canInvite(office.role, input.role))
      return json({ error: "You cannot invite that role." }, 403);
    const { data: existing } = await db
      .from("brokerage_members")
      .select("id,status")
      .eq("brokerage_id", office.id)
      .eq("email", email)
      .maybeSingle();
    if (existing?.status === "active")
      return json({ error: "That person is already in this office." }, 409);
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { error } = await db.from("brokerage_invites").insert({
      brokerage_id: office.id,
      email,
      role: input.role,
      token_hash: tokenHash,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (notReady(error))
      return json({ error: "Team storage is not ready yet." }, 503);
    if (error) return json({ error: "Could not create the invite." }, 503);
    return json(
      {
        emailed: false,
        token,
        path: "/dashboard?board=Team&invite=" + token,
        message:
          "Email delivery is not connected. Share this link with the invited person. It expires in 14 days.",
      },
      201,
    );
  } catch (e) {
    return failure(e);
  }
}
