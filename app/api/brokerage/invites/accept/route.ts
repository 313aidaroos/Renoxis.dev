import { notReady } from "@/lib/renoxis/firm-store";
import { body, failure, json, session } from "@/lib/renoxis/http";

export async function POST(request: Request) {
  try {
    const { db } = await session(request);
    const input = await body(request);
    if (typeof input.token !== "string" || input.token.length < 20)
      throw new Error("This invite is invalid or expired.");
    const { data, error } = await db.rpc("renoxis_accept_invite", {
      token: input.token,
    });
    if (notReady(error))
      return json({ error: "Team storage is not ready yet." }, 503);
    if (error) return json({ error: "Could not accept the invite." }, 503);
    if (!data?.ok) return json({ error: data?.error || "Could not accept the invite." }, 400);
    return json({
      ok: true,
      brokerageId: data.brokerage_id,
      role: data.role,
      message: "You joined the office.",
    });
  } catch (e) {
    return failure(e);
  }
}
