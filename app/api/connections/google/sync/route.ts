import { session, json, body, failure } from "@/lib/renoxis/http";
import { googleFetch } from "@/lib/renoxis/google";
export async function GET(request: Request) {
  try {
    const { user } = await session();
    const kind = new URL(request.url).searchParams.get("kind");
    if (kind === "calendar") {
      const data = await googleFetch(
        user.id,
        "calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=30&timeMin=" +
          encodeURIComponent(new Date().toISOString()),
      );
      return json({ events: data.items || [] });
    }
    const data = await googleFetch(
      user.id,
      "gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX",
    );
    const messages = await Promise.all(
      (data.messages || []).map(async (m: { id: string }) => {
        const item = await googleFetch(
          user.id,
          "gmail/v1/users/me/messages/" +
            encodeURIComponent(m.id) +
            "?format=metadata&metadataHeaders=From&metadataHeaders=Subject",
        );
        const headers = item.payload?.headers || [];
        return {
          id: item.id,
          from:
            headers.find((h: { name: string }) => h.name === "From")?.value ||
            "Unknown sender",
          subject:
            headers.find((h: { name: string }) => h.name === "Subject")
              ?.value || "No subject",
          snippet: item.snippet,
        };
      }),
    );
    return json({ messages });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    if (input.confirm !== true || typeof input.id !== "string")
      throw new Error("Review and confirm the appointment first.");
    const { data: record } = await db
      .from("renoxis_records")
      .select("id,data")
      .eq("id", input.id)
      .eq("user_id", user.id)
      .eq("kind", "event")
      .single();
    if (!record) throw new Error("Appointment not found.");
    // Deterministic provider ID makes retries safe; Google event IDs accept base32hex (UUID hex fits).
    const id = record.id.replaceAll("-", "");
    try {
      const existing = await googleFetch(
        user.id,
        "calendar/v3/calendars/primary/events/" + id,
      );
      return json({ eventId: existing.id, alreadyExists: true });
    } catch {
      /* Insert below; duplicate IDs are rejected by Google. */
    }
    const event = await googleFetch(
      user.id,
      "calendar/v3/calendars/primary/events?sendUpdates=none",
      {
        method: "POST",
        body: JSON.stringify({
          id,
          summary: record.data.title,
          description: record.data.notes || "",
          start: { dateTime: record.data.start },
          end: { dateTime: record.data.end },
        }),
      },
    );
    return json({ eventId: event.id });
  } catch (e) {
    return failure(e);
  }
}
