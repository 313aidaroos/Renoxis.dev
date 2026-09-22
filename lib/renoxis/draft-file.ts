/** Phase A draft files — labeled DRAFT only; never a signed contract. */

export const DRAFT_DISCLAIMER =
  "DRAFT ONLY — not a signed contract, not legal advice, and not sent to anyone. Review before use.";

export type DraftKind = "generic" | "email_draft" | "offer_letter";

export function isDraftKind(value: unknown): value is DraftKind {
  return (
    value === "generic" ||
    value === "email_draft" ||
    value === "offer_letter"
  );
}

export function draftBanner(kind: DraftKind, title: string) {
  const label =
    kind === "email_draft"
      ? "EMAIL DRAFT"
      : kind === "offer_letter"
        ? "OFFER LETTER DRAFT"
        : "DOCUMENT DRAFT";
  return [
    "══════════════════════════════════════",
    label,
    DRAFT_DISCLAIMER,
    `Title: ${title}`,
    `Generated: ${new Date().toISOString()}`,
    "══════════════════════════════════════",
    "",
  ].join("\n");
}

export function wrapDraftFile(kind: DraftKind, title: string, body: string) {
  const cleanTitle = title.trim().slice(0, 120) || "Untitled draft";
  const cleanBody = body.trim();
  if (!cleanBody) throw new Error("Write the draft before saving it.");
  if (cleanBody.length > 10000)
    throw new Error("Draft is too long (max 10,000 characters).");
  return {
    title: cleanTitle,
    text: draftBanner(kind, cleanTitle) + cleanBody + "\n",
    filename:
      cleanTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "renoxis-draft",
  };
}
