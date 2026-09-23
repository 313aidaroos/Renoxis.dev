"use client";
import { useState, type ReactNode } from "react";
import {
  canApprove,
  canInvite,
  canRollup,
} from "@/lib/renoxis/access";
import type { Office } from "@/lib/renoxis/brokerage";
import { IXIS_SKU } from "@/lib/renoxis/ixis";
import { WalletLinks } from "./WalletLinks";
import { useWalletBalance } from "@/lib/renoxis/use-wallet-balance";

export type FirmDesk = {
  ready: boolean;
  userId: string;
  offices: Office[];
  office: Office | null;
  members: {
    id: string;
    email: string;
    role: string;
    status: string;
    user_id: string | null;
  }[];
  invites: { id: string; email: string; role: string; expires_at: string }[];
  notes: {
    id: string;
    body: string;
    shared: boolean;
    author_id: string;
    created_at: string;
  }[];
  outbox: {
    id: string;
    kind: string;
    to_email: string | null;
    subject: string;
    body: string;
    status: string;
    approved: boolean;
    provider: string;
    author_id: string;
  }[];
  commissions: {
    id: string;
    fee_base: number;
    bps: number;
    amount: number;
    status: string;
  }[];
};

async function call(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed. Please retry.");
  return data;
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="desk-panel">
      <header>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

export function TeamDesk({
  preview,
  firm,
  scope,
  busy,
  onChanged,
  onNotice,
  onScope,
  onOffice,
  walletHref,
}: {
  preview: boolean;
  firm: FirmDesk | null;
  scope: "book" | "team";
  busy: boolean;
  onChanged: () => void;
  onNotice: (message: string) => void;
  onScope: (view: "book" | "team") => void;
  onOffice: (id: string) => void;
  walletHref: string;
}) {
  const walletIxis = useWalletBalance();
  const [pending, setPending] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const locked = busy || pending;
  const run = async (work: () => Promise<string>) => {
    setPending(true);
    try {
      onNotice(await work());
      onChanged();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setPending(false);
    }
  };
  if (preview)
    return (
      <Panel title="Office">
        <div className="empty">
          <span className="empty-symbol">✧</span>
          <strong>Sign in to open an office</strong>
          <p>Invites, the firm ledger, and drafts live with your account.</p>
        </div>
      </Panel>
    );
  if (!firm)
    return (
      <Panel title="Office">
        <p className="muted">Loading the office…</p>
      </Panel>
    );
  if (!firm.ready)
    return (
      <Panel title="Office">
        <div className="empty">
          <span className="empty-symbol">✧</span>
          <strong>Team storage is not ready</strong>
          <p>
            Apply supabase/brokerage.sql to this project before creating an
            office. Your personal records are unchanged.
          </p>
        </div>
      </Panel>
    );
  if (!firm.office) {
    return (
      <Panel title="Create your office">
        <p className="muted">
          A brokerage is the workspace your team shares. You become the owner.
          No sample deals are added.
        </p>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const name = String(new FormData(event.currentTarget).get("name") || "");
            void run(async () => {
              await call("/api/brokerage", {
                method: "POST",
                body: JSON.stringify({ name }),
              });
              return "Office created. You are the owner.";
            });
          }}
        >
          <label className="field span-two">
            Office name
            <input name="name" required minLength={2} maxLength={120} />
          </label>
          <div className="actions span-two">
            <button className="primary" disabled={locked}>
              Create office
            </button>
          </div>
        </form>
      </Panel>
    );
  }
  const office = firm.office;

  return (
    <div className="two-column">
      <Panel title={office.name}>
        {firm.offices.length > 1 && (
          <div className="filter-row">
            {firm.offices.map((item) => (
              <button
                key={item.id}
                className={item.id === office.id ? "selected" : ""}
                onClick={() => onOffice(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
        <p className="muted">
          Your role is {office.role}.{" "}
          {`Your Apixis Wallet: ${walletIxis === null ? "—" : walletIxis.toLocaleString()} Ixis. Drafts are paid from your own Wallet. Buy Ixis opens Apixis Wallet and brings you back here.`}
        </p>
        <WalletLinks href={walletHref} />
        {canRollup(office.role) && (
          <div className="filter-row">
            <button
              className={scope === "book" ? "selected" : ""}
              onClick={() => onScope("book")}
            >
              My book
            </button>
            <button
              className={scope === "team" ? "selected" : ""}
              onClick={() => onScope("team")}
            >
              Office rollup
            </button>
          </div>
        )}
        {office.role === "owner" && (
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const name = String(new FormData(form).get("name") || "");
              void run(async () => {
                await call("/api/brokerage", {
                  method: "PATCH",
                  body: JSON.stringify({ brokerageId: office.id, name }),
                });
                return "Office renamed.";
              });
            }}
          >
            <label className="field">
              Rename office
              <input name="name" defaultValue={office.name} required minLength={2} maxLength={120} />
            </label>
            <div className="actions">
              <button disabled={locked}>Save name</button>
            </div>
          </form>
        )}
      </Panel>
      <Panel title="People">
        {firm.members.filter((member) => member.status === "active").length ? (
          firm.members
            .filter((member) => member.status === "active")
            .map((member) => (
              <article className="record-row" key={member.id}>
                <div>
                  <strong>{member.email}</strong>
                  <div className="record-meta">
                    <span className="tag">{member.role}</span>
                  </div>
                </div>
                {office.role === "owner" && member.user_id !== firm.userId && (
                  <button
                    className="danger-text"
                    disabled={locked}
                    onClick={() => {
                      if (!confirm(`Remove ${member.email} from the office?`)) return;
                      void run(async () => {
                        await call("/api/brokerage/members", {
                          method: "PATCH",
                          body: JSON.stringify({
                            brokerageId: office.id,
                            memberId: member.id,
                            status: "removed",
                          }),
                        });
                        return "Member removed.";
                      });
                    }}
                  >
                    Remove
                  </button>
                )}
              </article>
            ))
        ) : (
          <p className="muted">No active members yet.</p>
        )}
        {canInvite(office.role, "agent") && (
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              void run(async () => {
                const result = await call("/api/brokerage/invites", {
                  method: "POST",
                  body: JSON.stringify({
                    brokerageId: office.id,
                    email: data.get("email"),
                    role: data.get("role"),
                  }),
                });
                setInviteLink(result.path);
                form.reset();
                return result.message;
              });
            }}
          >
            <label className="field">
              Invite email
              <input name="email" type="email" required />
            </label>
            <label className="field">
              Role
              <select name="role" defaultValue="agent">
                {office.role === "owner" && <option value="owner">owner</option>}
                {office.role === "owner" && <option value="broker">broker</option>}
                <option value="agent">agent</option>
                <option value="assistant">assistant</option>
              </select>
            </label>
            <div className="actions span-two">
              <button className="primary" disabled={locked}>
                Create invite
              </button>
            </div>
          </form>
        )}
        {inviteLink && (
          <p className="record-notes">
            Share this link. Mail was not sent. {inviteLink}
          </p>
        )}
        {firm.invites.map((invite) => (
          <article className="record-row" key={invite.id}>
            <div>
              <strong>{invite.email}</strong>
              <div className="record-meta">
                <span className="tag">{invite.role}</span>
                <span>Pending · not emailed</span>
              </div>
            </div>
          </article>
        ))}
      </Panel>
      <Panel title="Office actions">
        <p className="muted">
          Email draft {IXIS_SKU.email_draft} · Offer letter {IXIS_SKU.offer_letter}
          Ixis, debited from the office, not a personal wallet. Saving a property
          and tracking a contact are free — Renoxis has no property-data source yet,
          so a “lookup” only saves what you type. Nothing here sends mail or invents comps.
        </p>
        <ActionForm
          title="Save a property (what you know — no data lookup yet)"
          cost={IXIS_SKU.property_lookup}
          locked={locked}
          fields={["title", "city"]}
          onSubmit={(data) =>
            run(async () => {
              const result = await call("/api/brokerage/actions", {
                method: "POST",
                body: JSON.stringify({
                  brokerageId: office.id,
                  sku: "property_lookup",
                  ref: crypto.randomUUID(),
                  data: { title: data.title, city: data.city },
                }),
              });
              return result.message;
            })
          }
        />
        <ActionForm
          title="Track a contact"
          cost={IXIS_SKU.track_contact}
          locked={locked}
          fields={["title", "email"]}
          onSubmit={(data) =>
            run(async () => {
              const result = await call("/api/brokerage/actions", {
                method: "POST",
                body: JSON.stringify({
                  brokerageId: office.id,
                  sku: "track_contact",
                  ref: crypto.randomUUID(),
                  data: {
                    title: data.title,
                    ...(data.email ? { email: data.email } : {}),
                  },
                }),
              });
              return result.message;
            })
          }
        />
        <DraftForm
          title="Email draft"
          cost={IXIS_SKU.email_draft}
          locked={locked}
          onSubmit={(draft) =>
            run(async () => {
              const result = await call("/api/brokerage/actions", {
                method: "POST",
                body: JSON.stringify({
                  brokerageId: office.id,
                  sku: "email_draft",
                  ref: crypto.randomUUID(),
                  draft,
                }),
              });
              return result.message;
            })
          }
        />
        <DraftForm
          title="Offer letter draft"
          cost={IXIS_SKU.offer_letter}
          locked={locked}
          onSubmit={(draft) =>
            run(async () => {
              const result = await call("/api/brokerage/actions", {
                method: "POST",
                body: JSON.stringify({
                  brokerageId: office.id,
                  sku: "offer_letter",
                  ref: crypto.randomUUID(),
                  draft,
                }),
              });
              return result.message;
            })
          }
        />
      </Panel>
      <Panel title="Approve outbox">
        <p className="muted">
          Drafts wait here. Approve does not send. Live Google send scopes stay
          off.
        </p>
        {firm.outbox.length ? (
          firm.outbox.map((item) => (
            <article className="record-row" key={item.id}>
              <div>
                <strong>{item.subject}</strong>
                <div className="record-meta">
                  <span className="tag">{item.kind}</span>
                  <span>{item.approved ? "Approved" : item.status}</span>
                  <span>{item.provider}</span>
                </div>
                <p className="record-notes">{item.body}</p>
              </div>
              <div className="record-actions">
                {canApprove(office.role) && !item.approved && (
                  <button
                    className="primary"
                    disabled={locked}
                    onClick={() =>
                      void run(async () => {
                        const result = await call("/api/brokerage/outbox", {
                          method: "POST",
                          body: JSON.stringify({
                            brokerageId: office.id,
                            id: item.id,
                            action: "approve",
                          }),
                        });
                        return result.message;
                      })
                    }
                  >
                    Approve
                  </button>
                )}
                <button
                  disabled={locked}
                  onClick={() =>
                    void run(async () => {
                      const result = await call("/api/brokerage/outbox", {
                        method: "POST",
                        body: JSON.stringify({
                          brokerageId: office.id,
                          id: item.id,
                          action: "send",
                        }),
                      });
                      return result.error;
                    })
                  }
                >
                  Check send
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">
            <span className="empty-symbol">✧</span>
            <strong>No drafts yet</strong>
            <p>Email and offer drafts you save will wait here for Approve.</p>
          </div>
        )}
      </Panel>
      <Panel title="Private notes">
        <p className="muted">
          A note stays with you unless you mark it shared. Owners and brokers
          can review notes in this office. Peers cannot.
        </p>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            void run(async () => {
              await call("/api/brokerage/notes", {
                method: "POST",
                body: JSON.stringify({
                  brokerageId: office.id,
                  body: data.get("body"),
                  shared: data.get("shared") === "on",
                }),
              });
              form.reset();
              return data.get("shared") === "on"
                ? "Note shared with the office."
                : "Private note saved.";
            });
          }}
        >
          <label className="field span-two">
            Note
            <textarea name="body" required maxLength={10000} rows={4} />
          </label>
          <label className="check-label">
            <input name="shared" type="checkbox" /> Share with the office
          </label>
          <div className="actions">
            <button disabled={locked}>Save note</button>
          </div>
        </form>
        {firm.notes.map((note) => (
          <article className="record-row" key={note.id}>
            <div>
              <p className="record-notes">{note.body}</p>
              <div className="record-meta">
                <span className="tag">{note.shared ? "Shared" : "Private"}</span>
              </div>
            </div>
          </article>
        ))}
        {!firm.notes.length && <p className="muted">No notes you can see.</p>}
      </Panel>
      <Panel title="Platform commission">
        <p className="muted">
          Closed deals record a 5% (500 bps) platform cut as pending. Nothing is
          collected until a hub wallet exists.
        </p>
        {firm.commissions.length ? (
          firm.commissions.map((row) => (
            <article className="record-row" key={row.id}>
              <div>
                <strong>{Number(row.amount).toLocaleString()} pending</strong>
                <div className="record-meta">
                  <span className="tag">{row.status}</span>
                  <span>{row.bps} bps of {row.fee_base}</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="muted">No closed-deal commission rows yet.</p>
        )}
      </Panel>
    </div>
  );
}

function ActionForm({
  title,
  cost,
  locked,
  fields,
  onSubmit,
}: {
  title: string;
  cost: number;
  locked: boolean;
  fields: ("title" | "city" | "email")[];
  onSubmit: (data: Record<string, string>) => void;
}) {
  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form).entries()) as Record<
          string,
          string
        >;
        const warning =
          cost === 0
            ? `${title}? This does not debit Ixis. Billed to office.`
            : `${title}? This debits ${cost} Ixis from the office balance.`;
        if (!confirm(warning)) return;
        onSubmit(data);
        form.reset();
      }}
    >
      <h3 className="span-two">{title}</h3>
      {fields.map((field) => (
        <label className="field" key={field}>
          {field === "title" ? "Name / address" : field === "city" ? "City, state" : "Email"}
          <input name={field} required={field === "title"} type={field === "email" ? "email" : "text"} />
        </label>
      ))}
      <div className="actions">
        <button disabled={locked}>{cost === 0 ? "Save · 0 Ixis" : `Save · ${cost} Ixis`}</button>
      </div>
    </form>
  );
}

function DraftForm({
  title,
  cost,
  locked,
  onSubmit,
}: {
  title: string;
  cost: number;
  locked: boolean;
  onSubmit: (draft: { subject: string; email: string; body: string }) => void;
}) {
  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        if (!confirm(`${title}? This debits ${cost} Ixis and does not send.`)) return;
        onSubmit({
          subject: String(data.get("subject") || ""),
          email: String(data.get("email") || ""),
          body: String(data.get("body") || ""),
        });
        form.reset();
      }}
    >
      <h3 className="span-two">{title}</h3>
      <label className="field">
        Subject
        <input name="subject" required maxLength={200} />
      </label>
      <label className="field">
        To
        <input name="email" type="email" />
      </label>
      <label className="field span-two">
        Draft
        <textarea name="body" required maxLength={10000} rows={4} />
      </label>
      <div className="actions span-two">
        <button disabled={locked}>Save draft · {cost} Ixis</button>
      </div>
    </form>
  );
}
