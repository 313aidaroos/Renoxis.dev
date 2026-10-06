"use client";

import { useState, type ReactNode } from "react";
import { IXIS_SKU } from "@/lib/renoxis/ixis";
import { roleLabel, statusLabel } from "@/lib/renoxis/office-access";
import type { FirmDesk } from "./TeamDesk";
import { CixyPageHelp } from "./CixyPageHelp";

async function call(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed. Please retry.");
  return data;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="desk-panel">
      <header>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

const managerSteps = [
  "Name your brokerage. You can change the name later.",
  "Add an agent by email. If they already have an account, they join now. If not, share the link. Mail is not sent for you.",
  "Check the office Wallet. Add Ixis on Apixis Wallet. Agent jobs are paid from that Wallet, not from the agent.",
  "Read each person's status and how many Ixis their Cixy jobs have used.",
  "Review recent office activity. Apixis keeps 5% of a closed-deal fee.",
];

const agentSteps = [
  "This page shows the brokerage you belong to.",
  "Email is 50 Ixis, an offer letter is 100 Ixis, and a property lookup is 25 Ixis. The office pays, not you.",
  "Saving a contact is free. Nothing on this page sends mail.",
];

export function BrokerageDesk({
  preview,
  firm,
  busy,
  onChanged,
  onNotice,
  onOffice,
  walletHref,
}: {
  preview: boolean;
  firm: FirmDesk | null;
  busy: boolean;
  onChanged: () => void;
  onNotice: (message: string) => void;
  onOffice: (id: string) => void;
  walletHref: string;
}) {
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

  if (preview) {
    return (
      <Panel title="Brokerage">
        <div className="empty">
          <span className="empty-symbol">▣</span>
          <strong>Sign in to open your brokerage</strong>
          <p>Office Ixis, agents, and Cixy jobs live with your account.</p>
        </div>
      </Panel>
    );
  }
  if (!firm) {
    return (
      <Panel title="Brokerage">
        <p className="muted">Loading your brokerage…</p>
      </Panel>
    );
  }
  if (!firm.ready) {
    return (
      <Panel title="Brokerage">
        <div className="empty">
          <span className="empty-symbol">▣</span>
          <strong>Brokerage storage is not ready</strong>
          <p>
            Apply supabase/brokerage.sql and the office Wallet migration before
            creating a brokerage. Your personal records are unchanged.
          </p>
        </div>
      </Panel>
    );
  }

  const office = firm.office;
  const manage = Boolean(firm.access?.canViewSpend || firm.access?.canInvite || firm.access?.canRename);
  const help = (
    <CixyPageHelp
      title={manage ? "How the brokerage page works" : "How this page works"}
      steps={manage ? managerSteps : agentSteps}
    />
  );

  if (!office) {
    return (
      <div>
        <div className="brokerage-head">
          <div>
            <span className="eyebrow">BROKERAGE</span>
            <h2>Create your brokerage</h2>
          </div>
          {help}
        </div>
        <Panel title="Office name">
          <p className="muted">
            A brokerage is the office your agents share. You become the owner.
            Cixy jobs are paid from your Apixis Wallet, which is the office Wallet.
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
                return "Brokerage created. You are the owner.";
              });
            }}
          >
            <label className="field span-two">
              Brokerage name
              <input name="name" required minLength={2} maxLength={120} placeholder="Harbor Street Realty" />
            </label>
            <div className="actions span-two">
              <button className="primary" disabled={locked}>
                Create brokerage
              </button>
            </div>
          </form>
        </Panel>
      </div>
    );
  }

  const canSpend = Boolean(firm.access?.canViewSpend);
  const canInvite = Boolean(firm.access?.canInvite);
  const canRename = Boolean(firm.access?.canRename);
  const canRemove = Boolean(firm.access?.canRemove);
  const buy = firm.wallet?.buy || walletHref;

  return (
    <div>
      <div className="brokerage-head">
        <div>
          <span className="eyebrow">BROKERAGE</span>
          <h2>{office.name}</h2>
          <p className="muted">
            You are {roleLabel(office.role).toLowerCase()} here.
            {firm.access?.masterAdmin ? " You can also open every brokerage." : ""}
          </p>
        </div>
        {help}
      </div>
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
      {!canSpend ? (
        <Panel title="Your brokerage">
          <p>
            You are in <strong>{office.name}</strong>. Email ({IXIS_SKU.email_draft} Ixis),
            offer letters ({IXIS_SKU.offer_letter} Ixis), and property lookups ({IXIS_SKU.property_lookup} Ixis)
            are paid by the office, not from your personal Ixis.
          </p>
          <p className="muted">
            Saving a contact is free. Apixis keeps 5% of a closed-deal fee.
            Nothing here sends mail.
          </p>
        </Panel>
      ) : (
        <div className="two-column">
          <Panel title="Office Wallet">
            <p>
              Balance:{" "}
              <strong>
                {firm.wallet?.available == null
                  ? "Shows after the owner signs in with Apixis"
                  : `${firm.wallet.available.toLocaleString()} Ixis`}
              </strong>
            </p>
            <p className="muted">
              This is the Apixis Wallet of the brokerage owner. Agent jobs are paid from it:
              email {IXIS_SKU.email_draft} Ixis, offer letter {IXIS_SKU.offer_letter} Ixis,
              property lookup {IXIS_SKU.property_lookup} Ixis. Add Ixis on Apixis Wallet.
              You come back to this page.
            </p>
            <div className="actions">
              <a className="primary" href={buy}>
                Add Ixis
              </a>
            </div>
            {canRename && (
              <form
                className="form-grid"
                onSubmit={(event) => {
                  event.preventDefault();
                  const name = String(new FormData(event.currentTarget).get("name") || "");
                  void run(async () => {
                    await call("/api/brokerage", {
                      method: "PATCH",
                      body: JSON.stringify({ brokerageId: office.id, name }),
                    });
                    return "Brokerage renamed.";
                  });
                }}
              >
                <label className="field">
                  Brokerage name
                  <input name="name" defaultValue={office.name} required minLength={2} maxLength={120} />
                </label>
                <div className="actions">
                  <button disabled={locked}>Save name</button>
                </div>
              </form>
            )}
          </Panel>
          <Panel title="Agents">
            {firm.members.length ? (
              firm.members.map((member) => {
                const spend = member.user_id ? firm.spendByUser?.[member.user_id] : undefined;
                return (
                  <article className="record-row" key={member.id}>
                    <div>
                      <strong>{member.email}</strong>
                      <div className="record-meta">
                        <span className="tag">{roleLabel(member.role)}</span>
                        <span className="tag">{statusLabel(member.status)}</span>
                        {canSpend && (
                          <span>
                            {spend?.jobs ? `${spend.jobs} jobs · ${spend.spent.toLocaleString()} Ixis` : "No Cixy jobs yet"}
                          </span>
                        )}
                      </div>
                    </div>
                    {canRemove && member.user_id !== firm.userId && member.status !== "removed" && (
                      <button
                        className="danger-text"
                        disabled={locked}
                        onClick={() => {
                          if (!confirm(`Remove ${member.email} from the brokerage?`)) return;
                          void run(async () => {
                            await call("/api/brokerage/members", {
                              method: "PATCH",
                              body: JSON.stringify({
                                brokerageId: office.id,
                                memberId: member.id,
                                status: "removed",
                              }),
                            });
                            return "Removed from the brokerage.";
                          });
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </article>
                );
              })
            ) : (
              <p className="muted">No one is in this brokerage yet.</p>
            )}
            {canInvite && (
              <form
                className="form-grid"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const data = new FormData(form);
                  void run(async () => {
                    const result = await call("/api/brokerage/members", {
                      method: "POST",
                      body: JSON.stringify({
                        brokerageId: office.id,
                        email: data.get("email"),
                        role: data.get("role"),
                      }),
                    });
                    setInviteLink(result.path || "");
                    form.reset();
                    return result.message;
                  });
                }}
              >
                <label className="field">
                  Email
                  <input name="email" type="email" required placeholder="agent@brokerage.com" />
                </label>
                <label className="field">
                  Role
                  <select name="role" defaultValue="agent">
                    {(office.role === "owner" || firm.access?.masterAdmin) && (
                      <option value="owner">Owner</option>
                    )}
                    {(office.role === "owner" || firm.access?.masterAdmin) && (
                      <option value="broker">Manager</option>
                    )}
                    <option value="agent">Agent</option>
                    <option value="assistant">Assistant</option>
                  </select>
                </label>
                <div className="actions span-two">
                  <button className="primary" disabled={locked}>
                    Add agent
                  </button>
                </div>
              </form>
            )}
            {inviteLink && (
              <p className="record-notes">Share this link. Mail was not sent. {inviteLink}</p>
            )}
            {firm.invites.map((invite) => (
              <article className="record-row" key={invite.id}>
                <div>
                  <strong>{invite.email}</strong>
                  <div className="record-meta">
                    <span className="tag">{roleLabel(invite.role)}</span>
                    <span>Invited · link not emailed</span>
                  </div>
                </div>
              </article>
            ))}
          </Panel>
          <Panel title="Recent activity">
            {firm.activity?.length ? (
              firm.activity.map((item) => (
                <article className="record-row" key={item.id}>
                  <div>
                    <strong>{item.label}</strong>
                    <div className="record-meta">
                      <span>{item.email}</span>
                      <span>{item.amount.toLocaleString()} Ixis</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty">
                <span className="empty-symbol">▣</span>
                <strong>No office jobs yet</strong>
                <p>Email, offer letters, and property lookups will show up here.</p>
              </div>
            )}
          </Panel>
          <Panel title="Closed-deal fees">
            <p className="muted">
              Apixis keeps 5% of a closed-deal fee. It is recorded as pending.
              It is not taken from the office Wallet on this page.
            </p>
            {firm.commissions.length ? (
              firm.commissions.map((row) => (
                <article className="record-row" key={row.id}>
                  <div>
                    <strong>{Number(row.amount).toLocaleString()} pending</strong>
                    <div className="record-meta">
                      <span className="tag">5%</span>
                      <span>of {row.fee_base}</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted">No closed-deal fees yet.</p>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
