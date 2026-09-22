export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Build the payload for /api/chat: only real conversation turns.
 * Drops leading welcome/assistant bubbles so the first role is always user.
 */
export function chatTurnsForApi(messages: ChatTurn[]): ChatTurn[] {
  const turns = messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.trim() }));
  let start = 0;
  while (start < turns.length && turns[start].role === "assistant") start += 1;
  return turns.slice(start);
}
