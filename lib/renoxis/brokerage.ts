import { isRole, type Role } from "@/lib/renoxis/access";

export type Office = {
  id: string;
  name: string;
  slug: string;
  status: string;
  role: Role;
  balance: number | null;
  billedToOffice: true;
};

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function slugify(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (slug.length < 2)
    throw new Error("Use an office name with at least two letters or numbers.");
  return slug;
}

export function officeName(value: unknown) {
  if (typeof value !== "string") throw new Error("Enter an office name.");
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120)
    throw new Error("Office name must be 2–120 characters.");
  return name;
}

export function inviteEmail(value: unknown) {
  if (typeof value !== "string") throw new Error("Enter an email address.");
  const email = value.trim().toLowerCase();
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email.");
  return email;
}

export function storageMissing(
  error: { code?: string; message?: string } | null | undefined,
) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.code === "PGRST202" ||
    error.code === "42883" ||
    /schema cache|does not exist|Could not find the function/i.test(
      error.message || "",
    )
  );
}

export function asOffice(value: unknown): Office | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Office;
  if (!isUuid(row.id) || !isRole(row.role) || typeof row.name !== "string")
    return null;
  return {
    id: row.id,
    name: row.name,
    slug: typeof row.slug === "string" ? row.slug : "",
    status: typeof row.status === "string" ? row.status : "active",
    role: row.role,
    balance:
      typeof row.balance === "number" && Number.isInteger(row.balance)
        ? row.balance
        : null,
    billedToOffice: true,
  };
}
