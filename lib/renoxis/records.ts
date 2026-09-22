export const stages = [
  "New",
  "Contacted",
  "Showing",
  "Offer",
  "Under contract",
  "Closed",
] as const;
export const definitions = {
  lead: {
    label: "Lead",
    fields: ["title", "email", "phone", "stage", "property", "notes"],
  },
  client: { label: "Client", fields: ["title", "email", "phone", "notes"] },
  property: {
    label: "Property",
    fields: [
      "title",
      "city",
      "price",
      "beds",
      "baths",
      "status",
      "sourceUrl",
      "notes",
    ],
  },
  transaction: {
    label: "Transaction",
    fields: ["title", "price", "commission", "status", "progress", "nextStep"],
  },
  task: { label: "Task", fields: ["title", "due", "done"] },
  event: { label: "Appointment", fields: ["title", "start", "end", "notes"] },
  renovation: {
    label: "Renovation",
    fields: ["title", "budget", "status", "notes"],
  },
  social: { label: "Social draft", fields: ["title", "status", "notes"] },
  document: { label: "Document link", fields: ["title", "sourceUrl", "notes"] },
  draft: { label: "Email draft", fields: ["title", "email", "notes"] },
  settings: {
    label: "Workspace preferences",
    fields: [
      "title",
      "displayName",
      "brokerage",
      "specialty",
      "tools",
      "timezone",
    ],
  },
} as const;
export type Kind = keyof typeof definitions;
export type Values = Record<string, string | number | boolean>;
export type RecordItem = {
  id: string;
  kind: Kind;
  data: Values;
  version: number;
  created_at: string;
  updated_at: string;
  brokerage_id?: string | null;
  owner_agent_id?: string | null;
  visibility?: "firm" | "book" | "private";
};
export const labels: Record<string, string> = {
  title: "Name / title",
  email: "Email address",
  phone: "Phone",
  stage: "Pipeline stage",
  property: "Property address",
  notes: "Notes / draft",
  city: "City, state",
  price: "Price ($)",
  beds: "Bedrooms",
  baths: "Bathrooms",
  status: "Status",
  sourceUrl: "Public HTTPS link",
  commission: "Expected commission ($)",
  progress: "Progress (%)",
  nextStep: "Next step",
  due: "Due date",
  start: "Starts (your local time)",
  end: "Ends (your local time)",
  budget: "Budget ($)",
  displayName: "Display name",
  brokerage: "Brokerage",
  specialty: "Specialty",
  tools: "Existing tools",
  timezone: "Timezone (e.g. America/Detroit)",
};
/** Greeting/account label: saved display name, else email local-part, else "there". */
export function workspaceDisplayName(
  displayName: unknown,
  accountEmail?: string | null,
  preview = false,
) {
  const saved = typeof displayName === "string" ? displayName.trim() : "";
  if (saved) return saved.slice(0, 80);
  if (preview || !accountEmail) return "there";
  const local = accountEmail.split("@")[0]?.trim() || "";
  return local || "there";
}

export function isKind(value: unknown): value is Kind {
  return typeof value === "string" && Object.hasOwn(definitions, value);
}
export function safeLink(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/i.test(u.hostname)
    );
  } catch {
    return false;
  }
}
export function validateRecord(
  kind: unknown,
  value: unknown,
): { kind: Kind; data: Values } {
  if (
    !isKind(kind) ||
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  )
    throw new Error("Invalid record type.");
  const input = value as Values;
  const data: Values = {};
  for (const field of definitions[kind].fields) {
    const v = input[field];
    if (v === undefined || v === "") continue;
    if (
      ["price", "beds", "baths", "commission", "progress", "budget"].includes(
        field,
      )
    ) {
      if (
        typeof v !== "number" ||
        !Number.isFinite(v) ||
        v < 0 ||
        v > 1e12 ||
        (field === "progress" && v > 100)
      )
        throw new Error(`Invalid ${field}.`);
      data[field] = v;
    } else if (field === "done") {
      if (typeof v !== "boolean") throw new Error("Invalid task state.");
      data[field] = v;
    } else {
      if (
        typeof v !== "string" ||
        v.length > (field === "notes" ? 10000 : 1000)
      )
        throw new Error(`Invalid ${field}.`);
      data[field] = v.trim();
    }
  }
  if (!data.title || String(data.title).length > 200)
    throw new Error("A title of 1–200 characters is required.");
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email)))
    throw new Error("Enter a valid email.");
  if (data.sourceUrl && !safeLink(data.sourceUrl))
    throw new Error("Enter a public HTTPS link without credentials.");
  if (data.stage && !stages.includes(data.stage as (typeof stages)[number]))
    throw new Error("Invalid pipeline stage.");
  if (data.timezone) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: String(data.timezone) });
    } catch {
      throw new Error("Invalid timezone.");
    }
  }
  if (kind === "event") {
    if (
      !data.start ||
      !data.end ||
      !Number.isFinite(Date.parse(String(data.start))) ||
      !Number.isFinite(Date.parse(String(data.end))) ||
      Date.parse(String(data.end)) <= Date.parse(String(data.start))
    )
      throw new Error("An end time after the start time is required.");
    data.start = new Date(String(data.start)).toISOString();
    data.end = new Date(String(data.end)).toISOString();
  }
  return { kind, data };
}
export function totals(records: Pick<RecordItem, "kind" | "data">[]) {
  const deals = records.filter((r) => r.kind === "transaction");
  return {
    forecast: deals
      .filter((r) => r.data.status !== "Cancelled")
      .reduce((n, r) => n + Number(r.data.commission || 0), 0),
    closed: deals.filter((r) => r.data.status === "Closed").length,
    tasks: records.filter((r) => r.kind === "task" && !r.data.done).length,
  };
}
