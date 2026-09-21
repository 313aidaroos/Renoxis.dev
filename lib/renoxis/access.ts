export const roles = ["owner", "broker", "agent", "assistant"] as const;
export type Role = (typeof roles)[number];
export type Visibility = "firm" | "book" | "private";

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export function canInvite(actor: Role, invitee: Role) {
  if (actor === "owner") return true;
  if (actor === "broker") return invitee === "agent" || invitee === "assistant";
  return false;
}

export function canApprove(role: Role) {
  return role === "owner" || role === "broker";
}

export function seesFirmBalance(role: Role) {
  return role === "owner" || role === "broker";
}

export function canRollup(role: Role) {
  return role === "owner" || role === "broker";
}

export type Viewer = { userId: string; brokerageId: string; role: Role };
export type ScopedRecord = {
  brokerageId: string | null;
  ownerAgentId: string | null;
  visibility: Visibility;
  authorId: string;
};

/**
 * Mirrors renoxis_private.can_read_record.
 * Peers do not see another agent's book or a private record.
 * Owner and broker can roll up the office, including private records.
 */
export function canReadRecord(viewer: Viewer, record: ScopedRecord) {
  if (!record.brokerageId || record.brokerageId !== viewer.brokerageId)
    return false;
  if (record.authorId === viewer.userId) return true;
  if (viewer.role === "owner" || viewer.role === "broker") return true;
  if (record.visibility === "firm") return true;
  return record.visibility === "book" && record.ownerAgentId === viewer.userId;
}

export function canReadNote(
  viewer: Viewer,
  note: { brokerageId: string; authorId: string; shared: boolean },
) {
  if (note.brokerageId !== viewer.brokerageId) return false;
  if (note.authorId === viewer.userId) return true;
  if (viewer.role === "owner" || viewer.role === "broker") return true;
  return note.shared;
}

export function recordVisibility(role: Role, requested: unknown): Visibility {
  if (role === "owner" || role === "broker") {
    if (requested === "book" || requested === "private") return requested;
    return "firm";
  }
  return requested === "private" ? "private" : "book";
}

export function listView(role: Role, requested: unknown): "book" | "team" {
  if (canRollup(role) && requested === "team") return "team";
  return "book";
}
