"use client";
import { useState } from "react";
import type { RecordItem, Values } from "@/lib/renoxis/records";
import { WalletLinks } from "./WalletLinks";
export type Connections = {
  storage: boolean;
  ai: boolean;
  google: {
    configured: boolean;
    connected: boolean;
    email: string | null;
    scopes: string;
  };
  wallet: boolean;
};
export default function CixySetup({
  account,
  settings,
  status,
  save,
  refresh,
  preview,
  walletHref,
}: {
  account: string;
  settings?: RecordItem;
  status: Connections | null;
  save: (values: Values) => Promise<void>;
  refresh: () => Promise<void>;
  preview: boolean;
  walletHref: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function connect() {
    setBusy(true);
    try {
      const res = await fetch("/api/connections/google/start", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not connect.");
    } finally {
      setBusy(false);
    }
  }
  async function disconnect() {
    if (!confirm("Disconnect Google and revoke Renoxis access?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/connections", { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      await refresh();
      setMessage("Google disconnected.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not disconnect.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="setup-flow">
      <div className="section-title">
        <span className="eyebrow">YOUR WORKSPACE, CONNECTED</span>
        <h2>Make yourself at home.</h2>
        <p>Connect your tools and tell Cixy how you work.</p>
      </div>
      <div className="connection-grid">
        {[
          ["Workspace", status?.storage ? "Connected" : "Sign in to check"],
          ["Cixy AI", status?.ai ? "Configured" : "Provider setup pending"],
          [
            "Google",
            status?.google.connected
              ? status.google.email || "Connected"
              : status?.google.configured
                ? "Ready to connect"
                : "Owner setup pending",
          ],
        ].map(([name, label]) => (
          <article className="connection-card" key={name}>
            <strong>{name}</strong>
            <span>{label}</span>
          </article>
        ))}
        <article className="connection-card">
          <strong>Apixis Wallet</strong>
          <span>Buy Ixis · cash credit on Wallet</span>
          <WalletLinks href={walletHref} />
        </article>
      </div>
      <div className="actions">
        <button
          disabled={busy || preview}
          onClick={status?.google.connected ? disconnect : connect}
        >
          {status?.google.connected
            ? "Disconnect Google"
            : "Connect Gmail & Calendar"}
        </button>
        <button
          disabled={busy || preview}
          onClick={() =>
            void refresh().catch(() =>
              setMessage("Could not refresh connections."),
            )
          }
        >
          Refresh status
        </button>
      </div>
      <p className="muted">
        Google access is per account. Inbox access is read-only. Calendar writes
        require your review and do not invite attendees. Outlook, MLS and
        external CRMs are not connected yet. Buy Ixis opens Apixis Wallet.
        Renoxis does not take a card.
      </p>
      <form
        key={settings?.id || "new"}
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const values: Values = { title: "Workspace preferences" };
          for (const [k, v] of form) values[k] = String(v);
          setBusy(true);
          try {
            await save(values);
            setMessage("Preferences saved to your account.");
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Save failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          {[
            ["displayName", "Your name", ""],
            ["brokerage", "Brokerage", ""],
            ["specialty", "Specialty", "Agent operations"],
            ["timezone", "Timezone", "America/Detroit"],
            ["tools", "Existing tools / subscriptions", ""],
          ].map(([key, label, fallback]) => (
            <label className="field" key={key}>
              {label}
              <input
                name={key}
                maxLength={1000}
                defaultValue={String(settings?.data[key] || fallback)}
              />
            </label>
          ))}
        </div>
        <p className="muted">
          Signed in as {account}. Never enter passwords or API keys here.
        </p>
        <button className="primary" disabled={preview || busy}>
          {busy ? "Saving…" : "Save preferences"}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
