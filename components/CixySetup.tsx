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
  const currentName = String(settings?.data.displayName || "").trim();
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
  async function savePreferences(form: HTMLFormElement) {
    const data = new FormData(form);
    const values: Values = { title: "Workspace preferences" };
    for (const [k, v] of data) values[k] = String(v);
    setBusy(true);
    try {
      await save(values);
      const next = String(values.displayName || "").trim();
      setMessage(
        next
          ? `Display name saved. Desk greeting is now “Hello, ${next}.”`
          : "Preferences saved. Greeting will use your email until you set a display name.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="setup-flow">
      <div className="section-title">
        <span className="eyebrow">YOUR WORKSPACE, CONNECTED</span>
        <h2>Make yourself at home.</h2>
        <p>Set how we greet you, then connect your tools.</p>
      </div>
      <form
        className="display-name-card desk-panel"
        key={"name-" + (settings?.id || "new") + "-" + currentName}
        onSubmit={async (e) => {
          e.preventDefault();
          await savePreferences(e.currentTarget);
        }}
      >
        <header>
          <h3>Display name</h3>
        </header>
        <p className="muted">
          This is the name on “Hello, …” across the desk and account button.
          Until you set one, we use the part before @ in your email
          ({account}).
        </p>
        <label className="field">
          Display name
          <input
            name="displayName"
            maxLength={80}
            autoComplete="nickname"
            placeholder="e.g. Awad"
            defaultValue={currentName}
            aria-label="Display name"
          />
        </label>
        <input type="hidden" name="brokerage" defaultValue={String(settings?.data.brokerage || "")} />
        <input type="hidden" name="specialty" defaultValue={String(settings?.data.specialty || "Agent operations")} />
        <input type="hidden" name="timezone" defaultValue={String(settings?.data.timezone || "America/Chicago")} />
        <input type="hidden" name="tools" defaultValue={String(settings?.data.tools || "")} />
        <div className="actions">
          <button className="primary" disabled={preview || busy} type="submit">
            {busy ? "Saving…" : currentName ? "Update display name" : "Save display name"}
          </button>
        </div>
      </form>
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
          await savePreferences(e.currentTarget);
        }}
      >
        <div className="section-title">
          <span className="eyebrow">WORKSPACE PREFERENCES</span>
          <h3>Brokerage details</h3>
        </div>
        <div className="form-grid">
          {[
            ["displayName", "Display name", currentName || ""],
            ["brokerage", "Brokerage", ""],
            ["specialty", "Specialty", "Agent operations"],
            ["timezone", "Timezone", "America/Chicago"],
            ["tools", "Existing tools / subscriptions", ""],
          ].map(([key, label, fallback]) => (
            <label className="field" key={key}>
              {label}
              <input
                name={key}
                maxLength={key === "displayName" ? 80 : 1000}
                placeholder={key === "displayName" ? "e.g. Awad" : undefined}
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
