/** Live provider send stays off until the mail hub contract exists. */
export const LIVE_SEND_ENABLED = false;

export type SendDecision = {
  sent: false;
  status: "pending_approve" | "approved";
  provider: "blocked" | "not_configured";
  error: string;
};

/**
 * Real outbound send requires an Approve flag.
 * Even after Approve, v1 does not call a mail provider.
 */
export function decideSend(input: {
  approved: boolean;
  liveSendEnabled?: boolean;
}): SendDecision {
  const live = input.liveSendEnabled ?? LIVE_SEND_ENABLED;
  if (!input.approved)
    return {
      sent: false,
      status: "pending_approve",
      provider: "blocked",
      error: "Approve this draft before any send.",
    };
  if (!live)
    return {
      sent: false,
      status: "approved",
      provider: "not_configured",
      error:
        "Approved. Outbound send is waiting on the mail hub. Nothing was sent.",
    };
  return {
    sent: false,
    status: "approved",
    provider: "blocked",
    error: "Live send is disabled in this release.",
  };
}
