import { canInvite, type Role } from "./access.ts";
import { isOwner } from "./owners.ts";

/** Confirmed Awad accounts (and ADMIN_EMAILS) can open every brokerage. */
export function isMasterAdmin(
  user: { email?: string | null; email_confirmed_at?: string | null } | null | undefined,
) {
  return isOwner(user);
}

export type OfficeAction = "rename" | "invite" | "remove" | "spend";

export function canManageOffice(input: {
  role: Role | null;
  masterAdmin: boolean;
  action: OfficeAction;
  invitee?: Role;
  targetRole?: Role;
  targetIsSelf?: boolean;
}) {
  if (input.action === "remove" && input.targetIsSelf) return false;
  if (input.masterAdmin) return true;
  const role = input.role;
  if (!role) return false;
  if (input.action === "rename") return role === "owner";
  if (input.action === "spend") return role === "owner" || role === "broker";
  if (input.action === "invite") {
    if (!input.invitee) return role === "owner" || role === "broker";
    return canInvite(role, input.invitee);
  }
  if (role === "owner") return true;
  if (role === "broker")
    return input.targetRole === "agent" || input.targetRole === "assistant";
  return false;
}

/** A member sees only their brokerage. A master admin can open any id. */
export function brokerageVisible(input: {
  requestedId: string;
  memberIds: readonly string[];
  masterAdmin: boolean;
}) {
  if (input.masterAdmin) return true;
  return input.memberIds.includes(input.requestedId);
}

export type BillDecision =
  | { kind: "office"; payer: string }
  | { kind: "personal"; payer: string }
  | { kind: "blocked"; reason: string };

/**
 * Cixy jobs inside a brokerage bill the office Wallet (the owner's Apixis
 * Wallet), never the agent who clicked. Someone with no brokerage still pays
 * from their own Wallet. A missing office Wallet blocks the job.
 */
export function jobPayer(input: {
  inBrokerage: boolean;
  actorPayer: string;
  officeWalletOwner: string | null;
}): BillDecision {
  if (input.inBrokerage) {
    if (!input.officeWalletOwner)
      return {
        kind: "blocked",
        reason: "This brokerage has no office Wallet yet. The owner needs to sign in with Apixis.",
      };
    return { kind: "office", payer: input.officeWalletOwner };
  }
  return { kind: "personal", payer: input.actorPayer };
}

export function roleLabel(role: string) {
  if (role === "owner") return "Owner";
  if (role === "broker") return "Manager";
  if (role === "agent") return "Agent";
  if (role === "assistant") return "Assistant";
  return "Member";
}

export function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "invited") return "Invited";
  if (status === "removed") return "Removed";
  return "Unknown";
}

export function jobLabel(sku: string) {
  if (sku === "email_draft") return "Email";
  if (sku === "offer_letter") return "Offer letter";
  if (sku === "property_lookup") return "Property lookup";
  if (sku === "track_contact") return "Contact";
  return "Office job";
}
