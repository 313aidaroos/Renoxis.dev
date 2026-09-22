"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import CixySetup, { type Connections } from "./CixySetup";
import CixyAvatar, { moods, type Mood } from "./CixyAvatar";
import {
  applyThemeCoat,
  catalog,
  catalogPriceLabel,
  DEFAULT_CIXY_NAME,
  DEFAULT_THEME,
  defaultLook,
  ESSENTIALS_ID,
  normalizePrefs,
  ownsCatalogItem,
  syncThemeAndCoat,
  themes,
  type DeskTheme,
  type Look,
} from "@/lib/renoxis/customization";
import {
  definitions,
  labels,
  stages,
  totals,
  validateRecord,
  type Kind,
  type Values,
  type RecordItem,
} from "@/lib/renoxis/records";
import { canRollup, seesFirmBalance } from "@/lib/renoxis/access";
import { TeamDesk, type FirmDesk } from "./TeamDesk";
import { WalletLinks } from "./WalletLinks";
import { FALLBACK_WALLET_HREF } from "@/lib/renoxis/wallet-link";
import {
  activateCopy,
  activateWalletHref,
  canUseCixyChat,
  canUseWorkspace,
  emptyEntitlement,
  redeemAwaitingCaptureCopy,
  renewCopy,
  renewWalletHref,
  seatStatus,
  type Entitlement,
} from "@/lib/renoxis/billing";
import "./command-desk.css";
const Chat = dynamic(() => import("./CixyChat").then((m) => m.CixyChat), {
  loading: () => <p>Opening Cixy…</p>,
});
const boards = [
  "Overview",
  "Email",
  "Calendar",
  "Leads",
  "Clients",
  "Properties",
  "Transactions",
  "Renovation Studio",
  "Social Studio",
  "Documents",
  "Analytics",
  "Cixy Studio",
  "Connections",
  "Team",
  "FAQs",
] as const;
type Board = (typeof boards)[number];
const symbols = [
  "⌂",
  "✉",
  "▦",
  "◎",
  "♧",
  "⌂",
  "⇄",
  "✧",
  "◈",
  "▤",
  "↗",
  "♡",
  "⚙",
  "⚑",
  "?",
];
const boardKind: Partial<Record<Board, Kind>> = {
  Leads: "lead",
  Clients: "client",
  Properties: "property",
  Transactions: "transaction",
  "Renovation Studio": "renovation",
  "Social Studio": "social",
  Documents: "document",
  Email: "draft",
  Calendar: "event",
};
const money = (v: unknown) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);
const text = (v: unknown) => String(v ?? "");
async function request(url: string, init?: RequestInit) {
  const r = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed. Please retry.");
  return d;
}
function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={"desk-panel " + className}>
      <header>
        <h2>{title}</h2>
        {action && (
          <button
            className="text-button"
            onClick={action}
            aria-label={"View " + title}
          >
            View all ↗
          </button>
        )}
      </header>
      {children}
    </section>
  );
}
function Empty({
  title,
  description,
  action,
  label = "Add your first record",
}: {
  title: string;
  description: string;
  action?: () => void;
  label?: string;
}) {
  return (
    <div className="empty">
      <span className="empty-symbol">✧</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action && (
        <button className="soft-button" onClick={action}>
          {label} →
        </button>
      )}
    </div>
  );
}
const faqs = [
  [
    "What is Renoxis?",
    "Your real-estate workspace for leads, clients, property records, appointments, documents and deal tracking—with Cixy alongside you.",
  ],
  [
    "Why do my numbers start at zero?",
    "Your dashboard uses your saved records. A new account starts empty. Forecasts add the expected commissions you enter, excluding cancelled deals; they are estimates, not earned income.",
  ],
  [
    "How do I connect email and calendar?",
    "Open Connections and choose Connect Gmail & Calendar. Google must first be configured by the site owner. Each customer authorizes their own account. Inbox access is read-only; publishing an appointment requires review. Outlook is planned.",
  ],
  [
    "Can Cixy send messages or act on her own?",
    "Cixy chat can answer questions and draft text. It does not send email, place calls, publish posts, or spend Ixis. Office drafts on the Team board debit the firm balance and wait for Approve. Approve does not send mail.",
  ],
  [
    "How do I customize Cixy?",
    "Use the Customize button below Cixy or open Cixy Studio. Skin, hair, eyes, blazer, and the office palette tint the signature artwork. Essentials are included. Preferences save on this device.",
  ],
  [
    "What are Ixis and how much do outfits cost?",
    "Ixis is the Apixis points unit. Property lookup, email drafts, and offer drafts debit the office balance. Tracking a contact is free. Premium outfits have no Ixis price yet. Buy Ixis opens Apixis Wallet and returns to Cixy Studio. Renoxis does not capture cards or credit a balance from that purchase.",
  ],
  [
    "How do I install the app?",
    "On iPhone or iPad, open this site in Safari, tap Share, then Add to Home Screen. On supported desktop or Android browsers, use the install option in the browser menu. The same account and live data are used; an internet connection is required.",
  ],
  [
    "Is my workspace private?",
    "Personal records stay on your account. Inside an office, firm records are shared with members. Another agent's book and your private notes stay hidden unless you share a note or an owner or broker reviews the office.",
  ],
  [
    "Can I import MLS listings automatically?",
    "You can save property details and public HTTPS listing links now. Licensed MLS feeds, automatic scraping, external CRM syncing, paid skip tracing and renovation image generation are not connected.",
  ],
  [
    "How do I save or export my work?",
    "Use Save in record forms. The top status shows account storage errors. Export downloads your records as JSON; private uploaded files are managed separately in Documents.",
  ],
];
export default function CommandDesk({
  preview = false,
  account = "Your account",
  accountControl,
  loginForm,
  walletHref = FALLBACK_WALLET_HREF,
  entitlement = emptyEntitlement(),
}: {
  preview?: boolean;
  account?: string;
  accountControl?: ReactNode;
  loginForm?: ReactNode;
  walletHref?: string;
  entitlement?: Entitlement;
}) {
  const [board, setBoard] = useState<Board>("Overview");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All");
  const [busy, setBusy] = useState(false);
  const [connections, setConnections] = useState<Connections | null>(null);
  const [mobile, setMobile] = useState(false);
  const [look, setLook] = useState<Look>(defaultLook);
  const [cixyName, setCixyName] = useState(DEFAULT_CIXY_NAME);
  const [wardrobe, setWardrobe] = useState<string[]>([ESSENTIALS_ID]);
  const [theme, setTheme] = useState<DeskTheme>(DEFAULT_THEME);
  const activateHref = activateWalletHref();
  const renewHref = renewWalletHref();
  const seat = seatStatus(preview, entitlement);
  const workspaceOpen = canUseWorkspace(seat);
  const cixyOpen = canUseCixyChat(seat);
  const [mood, setMood] = useState<Mood>("Smile");
  const [autoMood, setAutoMood] = useState(true);
  const [custom, setCustom] = useState(false);
  const [installMessage, setInstallMessage] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState("");
  const [messages, setMessages] = useState<
    { id: string; from: string; subject: string; snippet: string }[]
  >([]);
  const [googleEvents, setGoogleEvents] = useState<
    {
      id: string;
      summary: string;
      start: { dateTime?: string; date?: string };
    }[]
  >([]);
  const [files, setFiles] = useState<{ name: string; id: string }[]>([]);
  const [userId, setUserId] = useState("");
  const [firm, setFirm] = useState<FirmDesk | null>(null);
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [scope, setScope] = useState<"book" | "team">("book");
  const [formKind, setFormKind] = useState<Kind>("task");
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [formError, setFormError] = useState("");
  const [activeChat, setActiveChat] = useState(false);
  const editor = useRef<HTMLDialogElement>(null);
  const chatDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const reload = useCallback(
    async (id?: string | null, view?: "book" | "team") => {
      if (preview) return;
      const brokerageId = id === undefined ? officeId : id;
      const list = view || scope;
      setLoading(true);
      try {
        const q = brokerageId
          ? `?brokerageId=${encodeURIComponent(brokerageId)}&view=${list}`
          : "";
        const d = await request("/api/records" + q);
        setRecords(d.records);
        setError(
          d.truncated
            ? "Showing the newest 1,000 records. Export is limited to this view."
            : "",
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load.");
      } finally {
        setLoading(false);
      }
    },
    [preview, officeId, scope],
  );
  const loadFirm = useCallback(
    async (id?: string | null) => {
      if (preview) return null;
      const q = id ? `?brokerageId=${encodeURIComponent(id)}` : "";
      const payload = (await request("/api/brokerage" + q)) as FirmDesk;
      setFirm(payload);
      if (payload.userId) setUserId(payload.userId);
      setOfficeId(payload.office?.id || null);
      return payload;
    },
    [preview],
  );
  const refreshConnections = useCallback(async () => {
    if (preview) return;
    try {
      setConnections(await request("/api/connections"));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Connection check failed.");
    }
  }, [preview]);
  // Hydrate browser-only preferences and initial network state after mount.
  /* eslint-disable react-hooks/set-state-in-effect -- Hydrate browser-only preferences and fetch account data after mount. */
  useEffect(() => {
    void (async () => {
      let listId: string | null = null;
      let listView: "book" | "team" = "book";
      try {
        const params = new URLSearchParams(window.location.search);
        const invite = params.get("invite");
        let payload = await loadFirm();
        if (invite) {
          try {
            const accepted = await request("/api/brokerage/invites/accept", {
              method: "POST",
              body: JSON.stringify({ token: invite }),
            });
            setNotice(accepted.message || "You joined the office.");
            payload = await loadFirm(accepted.brokerageId);
            setBoard("Team");
            window.history.replaceState(null, "", "?board=Team");
          } catch (error) {
            setNotice(
              error instanceof Error ? error.message : "Invite was not accepted.",
            );
          }
        }
        const office = payload?.office;
        if (office && (office.role === "owner" || office.role === "broker"))
          listView = "team";
        listId = office?.id || null;
        if (office) setScope(listView);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Office check failed.");
      }
      await reload(listId, listView);
    })();
    void refreshConnections();
    const params = new URLSearchParams(window.location.search);
    const b = params.get("board");
    if (boards.includes(b as Board)) setBoard(b as Board);
    if (params.get("connection"))
      setNotice(
        params.get("connection") === "connected"
          ? "Google connected. Refresh your inbox or calendar to load your data."
          : "Google connection was not completed. Please try again.",
      );
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    setSelectedDate(local);
    setCalendarMonth(local.slice(0, 7));
    try {
      const saved = JSON.parse(
        localStorage.getItem("renoxis-cixy-v2:" + account) || "null",
      );
      const prefs = normalizePrefs(saved);
      const synced = syncThemeAndCoat(prefs.look, prefs.theme);
      setLook(synced.look);
      setCixyName(prefs.displayName);
      setWardrobe(prefs.wardrobe);
      setTheme(synced.theme);
      const billingIntent = params.get("billing");
      if (billingIntent === "activate" || billingIntent === "renew") {
        setBoard("Connections");
        setNotice(
          "Returned from Apixis Wallet. " +
            redeemAwaitingCaptureCopy(
              billingIntent === "activate" ? "activate" : "renew",
            ) +
            " Access remains blocked until server capture or an admin beta grant.",
        );
      }
    } catch {}
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    // Firm and record loads are started once. Later office changes call reload directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, preview]);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (
      !look.motion ||
      !autoMood ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = setInterval(
      () => setMood((m) => moods[(moods.indexOf(m) + 1) % moods.length]),
      12000,
    );
    return () => clearInterval(timer);
  }, [look.motion, autoMood]);
  const go = (b: Board) => {
    setBoard(b);
    setQuery("");
    setStage("All");
    setMobile(false);
    window.history.replaceState(null, "", "?board=" + encodeURIComponent(b));
  };
  const ask = () => {
    setActiveChat(true);
    chatDialog.current?.showModal();
  };
  const requireSeat = (forChat = false) => {
    if (preview) {
      ask();
      return false;
    }
    if (forChat ? !cixyOpen : !workspaceOpen) {
      setBoard("Connections");
      setNotice(
        seat === "signed_inactive"
          ? "Activate your Renoxis seat ($50 / 5,000 Ixis) in Apixis Wallet to use the workspace."
          : "Renew Keep running ($50 / 5,000 Ixis per month) in Apixis Wallet to continue.",
      );
      return false;
    }
    return true;
  };
  const add = (kind: Kind, r?: RecordItem) => {
    if (preview) {
      ask();
      return;
    }
    if (!requireSeat()) return;
    setFormKind(kind);
    setEditing(r || null);
    setFormError("");
    editor.current?.showModal();
  };
  const write = async (kind: Kind, data: Values, r?: RecordItem) => {
    if (preview) throw new Error("Sign in to save your work.");
    if (!workspaceOpen)
      throw new Error(
        seat === "signed_inactive"
          ? "Activate your seat to save workspace data."
          : "Renew your monthly seat to save workspace data.",
      );
    const clean = validateRecord(kind, data);
    const result = await request("/api/records", {
      method: r ? "PATCH" : "POST",
      body: JSON.stringify({
        ...clean,
        ...(officeId && !r ? { brokerageId: officeId } : {}),
        ...(r ? { id: r.id, version: r.version } : {}),
      }),
    });
    setRecords((old) =>
      r
        ? old.map((x) => (x.id === r.id ? result.record : x))
        : [result.record, ...old],
    );
    return result as { record: RecordItem; platformCommission?: { ok?: boolean } };
  };
  const remove = async (r: RecordItem) => {
    if (!requireSeat()) return;
    if (!confirm(`Delete “${r.data.title}”?`)) return;
    setBusy(true);
    try {
      await request("/api/records", {
        method: "DELETE",
        body: JSON.stringify({ id: r.id, version: r.version }),
      });
      setRecords((old) => old.filter((x) => x.id !== r.id));
      setNotice("Record deleted.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };
  const task = async (title: string) => {
    if (!requireSeat()) return;
    setBusy(true);
    try {
      await write("task", { title, done: false });
      setNotice("Follow-up task saved. No message was sent.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (r: RecordItem) => {
    setBusy(true);
    try {
      await write("task", { ...r.data, done: !r.data.done }, r);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };
  const sync = async (kind: "inbox" | "calendar") => {
    if (!requireSeat()) return;
    setBusy(true);
    try {
      const d = await request("/api/connections/google/sync?kind=" + kind);
      if (kind === "inbox") setMessages(d.messages);
      else setGoogleEvents(d.events);
      setNotice("Google data refreshed.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setBusy(false);
    }
  };
  const publish = async (r: RecordItem) => {
    if (
      !confirm(
        `Add “${r.data.title}” to your primary Google Calendar at ${new Date(text(r.data.start)).toLocaleString()}? No attendees will be invited.`,
      )
    )
      return;
    setBusy(true);
    try {
      const d = await request("/api/connections/google/sync", {
        method: "POST",
        body: JSON.stringify({ id: r.id, confirm: true }),
      });
      setNotice(
        d.alreadyExists
          ? "This appointment is already on Google Calendar."
          : "Google confirmed the appointment was added.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Calendar write failed.");
    } finally {
      setBusy(false);
    }
  };
  const loadFiles = async () => {
    if (preview) return;
    try {
      const d = await request("/api/documents");
      setFiles(d.files);
      const { createClient } = await import("@/lib/supabase/client");
      const {
        data: { user },
      } = await createClient().auth.getUser();
      setUserId(user?.id || "");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not load documents.");
    }
  };
  /* eslint-disable react-hooks/set-state-in-effect -- Hydrate browser-only preferences and fetch account data after mount. */
  useEffect(() => {
    if (board === "Documents") void loadFiles();
  }, [board]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      await request("/api/documents", { method: "POST", body: form });
      await loadFiles();
      setNotice("Private document uploaded.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { exportedAt: new Date().toISOString(), records },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "renoxis-workspace.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Workspace exported.");
  };
  const saveLook = () => {
    try {
      const name = cixyName.trim().slice(0, 40) || DEFAULT_CIXY_NAME;
      setCixyName(name);
      const owned = wardrobe.includes(ESSENTIALS_ID)
        ? wardrobe
        : [ESSENTIALS_ID, ...wardrobe];
      setWardrobe(owned);
      localStorage.setItem(
        "renoxis-cixy-v2:" + account,
        JSON.stringify({
          look,
          displayName: name,
          wardrobe: owned,
          theme,
        }),
      );
      setNotice(name + " appearance and wardrobe saved on this device.");
    } catch {
      setNotice("Your browser could not save preferences.");
    }
  };
  const byKind = (kind: Kind) => records.filter((r) => r.kind === kind);
  const stats = totals(records);
  const settings = byKind("settings")[0];
  const name =
    text(settings?.data.displayName) ||
    (preview ? "there" : account.split("@")[0]);
  const tasks = byKind("task");
  const leads = byKind("lead");
  const properties = byKind("property");
  const appointments = byKind("event");
  const taskList = (
    <>
      {tasks.length ? (
        tasks.slice(0, board === "Overview" ? 4 : 100).map((r) => (
          <div className="task-row" key={r.id}>
            <input
              type="checkbox"
              aria-label={"Complete " + r.data.title}
              checked={!!r.data.done}
              disabled={busy}
              onChange={() => void toggle(r)}
            />
            <button
              className={"text-button " + (r.data.done ? "complete" : "")}
              onClick={() => add("task", r)}
            >
              {r.data.title}
            </button>
          </div>
        ))
      ) : (
        <Empty
          title="A fresh start"
          description="Your next move starts with one task."
        />
      )}
      <button className="text-button" onClick={() => add("task")}>
        ＋ Add a task
      </button>
    </>
  );
  const inbox = (
    <>
      {messages.length ? (
        messages.map((m) => (
          <button
            className="mail-row"
            key={m.id}
            onClick={() =>
              window.open(
                "https://mail.google.com/mail/u/" +
                  encodeURIComponent(connections?.google.email || "0") +
                  "/#inbox/" +
                  m.id,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <span className="initial">✉</span>
            <span>
              <strong>{m.from}</strong>
              <small>{m.subject}</small>
              <p>{m.snippet}</p>
            </span>
          </button>
        ))
      ) : (
        <Empty
          title="Your inbox belongs here"
          description="Connect Google to bring in your latest messages."
          action={() => go("Connections")}
          label="Connect your inbox"
        />
      )}
    </>
  );
  const schedule = (
    <>
      {appointments
        .filter(
          (r) =>
            new Date(text(r.data.start)).toLocaleDateString() ===
            new Date(selectedDate + "T12:00").toLocaleDateString(),
        )
        .map((r) => (
          <button
            className="schedule-row"
            key={r.id}
            onClick={() => add("event", r)}
          >
            <time>
              {new Date(text(r.data.start)).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            <span className="dot" />
            <strong>{r.data.title}</strong>
          </button>
        ))}
      {!appointments.length && (
        <Empty
          title="Room for your next opportunity"
          description="Add a showing, call or closing appointment."
          action={() => add("event")}
          label="Add appointment"
        />
      )}
    </>
  );
  const leadList = (
    <>
      {leads.length ? (
        leads.slice(0, 3).map((r) => (
          <div className="lead-row" key={r.id}>
            <span className="initial">
              {text(r.data.title).slice(0, 2).toUpperCase()}
            </span>
            <button className="text-button" onClick={() => add("lead", r)}>
              <strong>{r.data.title}</strong>
              <small>{r.data.property || r.data.stage || "New lead"}</small>
            </button>
            <button
              className="small-button"
              disabled={busy}
              onClick={() => void task("Follow up: " + r.data.title)}
            >
              Follow up
            </button>
          </div>
        ))
      ) : (
        <Empty
          title="Meet your next client"
          description="Keep every opportunity in one place."
          action={() => add("lead")}
          label="Add a lead"
        />
      )}
    </>
  );
  const propertyCards = (
    <div className="property-grid">
      {properties.slice(0, board === "Overview" ? 2 : 100).map((r) => (
        <button
          className="property-card"
          key={r.id}
          onClick={() => add("property", r)}
        >
          <div className="property-visual">
            <svg viewBox="0 0 220 110" aria-hidden="true">
              <path d="M10 90h200" stroke="#bdd0c5" />
              <path
                d="M50 90V51l58-35 63 35v39"
                fill="#edf3e8"
                stroke="#7d9b88"
                strokeWidth="2"
              />
              <path
                d="M38 54l70-42 77 42"
                fill="none"
                stroke="#476e59"
                strokeWidth="5"
              />
              <path
                d="M95 90V63h27v27m-52-18V57h15v15m48 0V57h15v15"
                fill="#b7d3c5"
              />
              <circle cx="26" cy="68" r="15" fill="#9cba9a" />
              <path d="M26 69v21" stroke="#6d8865" />
            </svg>
            <span className="tag">{r.data.status || "Active"}</span>
          </div>
          <strong>{money(r.data.price)}</strong>
          <span>{r.data.title}</span>
          <small>
            {r.data.city} · {r.data.beds || 0} bed · {r.data.baths || 0} bath
          </small>
        </button>
      ))}
      {!properties.length && (
        <Empty
          title="Your portfolio starts here"
          description="Save a property and its listing link."
          action={() => add("property")}
          label="Add property"
        />
      )}
    </div>
  );
  const customization = (
    <div className="customize-box">
      <div className="section-title">
        <h3>Make {cixyName} yours</h3>
        <p>Signature artwork · Essentials included · saved on this device</p>
      </div>
      <p className="muted">
        Skin, hair, eyes, and blazer tint the signature painting. Hair style and
        office palette are variants of the same face — never a new character or
        SVG. Blazer follows desk theme (and the other way around).
      </p>
      <label className="field">
        Display name
        <input
          aria-label="Cixy display name"
          maxLength={40}
          value={cixyName}
          onChange={(e) => setCixyName(e.target.value)}
          placeholder={DEFAULT_CIXY_NAME}
        />
      </label>
      <div className="color-controls">
        {(["skin", "hair", "eyes", "outfit"] as const).map((k) => (
          <label key={k}>
            {k === "outfit" ? "Blazer" : k}
            <input
              aria-label={cixyName + " " + k + " color"}
              type="color"
              value={look[k]}
              onChange={(e) => {
                if (k !== "outfit") {
                  setLook({ ...look, [k]: e.target.value });
                  return;
                }
                const synced = syncThemeAndCoat(look, e.target.value);
                setTheme(synced.theme);
                setLook(synced.look);
              }}
            />
          </label>
        ))}
      </div>
      <p className="muted">Blazer follows desk theme.</p>
      <div className="form-grid">
        <label className="field">
          Hair style
          <select
            value={look.hairstyle}
            onChange={(e) =>
              setLook({
                ...look,
                hairstyle: e.target.value as Look["hairstyle"],
              })
            }
          >
            <option value="bun">Updo</option>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </label>
        <label className="field">
          Office palette
          <select
            value={look.room}
            onChange={(e) =>
              setLook({
                ...look,
                room: e.target.value as Look["room"],
              })
            }
          >
            <option value="mint">Morning mint</option>
            <option value="sunset">Warm afternoon</option>
            <option value="night">Evening blue</option>
          </select>
        </label>
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          checked={look.motion}
          onChange={(e) => setLook({ ...look, motion: e.target.checked })}
        />
        Animate {cixyName}
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={autoMood}
          onChange={(e) => setAutoMood(e.target.checked)}
        />
        Cycle through activities
      </label>
      <div className="actions">
        <button className="primary" onClick={saveLook}>
          Save {cixyName}
        </button>
        <button
          onClick={() => {
            setLook(defaultLook);
            setCixyName(DEFAULT_CIXY_NAME);
            setWardrobe([ESSENTIALS_ID]);
            setTheme(DEFAULT_THEME);
          }}
        >
          Reset look
        </button>
      </div>
      <button className="text-button" onClick={() => go("Cixy Studio")}>
        Explore the future collection ↗
      </button>
    </div>
  );
  const cixy = (
    <section className="cixy-office">
      <header>
        <h2>
          {cixyName} <span>— Your AI Real Estate Manager</span>
        </h2>
        <span className="status-pill">
          <i />
          {connections?.ai ? "Ready to chat" : "Your personal workspace"}
        </span>
      </header>
      <div className="cixy-stage">
        <CixyAvatar look={look} mood={mood} />
        <div className="orbit left">
          <button onClick={() => go("Leads")}>
            <span>◎</span>Find leads
          </button>
          <button onClick={() => go("Calendar")}>
            <span>▦</span>My schedule
          </button>
          <button onClick={() => go("Email")}>
            <span>✉</span>Email drafts
          </button>
        </div>
        <div className="orbit right">
          <button onClick={() => go("Analytics")}>
            <span>↗</span>Analyze deals
          </button>
          <button onClick={() => go("Renovation Studio")}>
            <span>✧</span>Renovations
          </button>
          <button onClick={() => go("Clients")}>
            <span>♧</span>My clients
          </button>
        </div>
        <div className="cixy-bubble">
          <strong>Hello, {name}.</strong>
          <p>
            {stats.tasks
              ? `You have ${stats.tasks} open tasks. Let’s make your next move count.`
              : "A new day. A little more possibility. What shall we work on?"}
          </p>
        </div>
      </div>
      <div className="cixy-actions">
        <button className="primary" onClick={ask}>
          ✦ Talk to {cixyName}
        </button>
        <button onClick={() => add("task")}>▤ Give a task</button>
        <button aria-expanded={custom} onClick={() => board === "Cixy Studio" ? document.getElementById("cixy-settings")?.scrollIntoView({behavior:"smooth"}) : setCustom(!custom)}>
          ♡ Customize
        </button>
      </div>
      <div className="mood-controls" aria-label="Cixy activities">
        {moods.map((m) => (
          <button
            key={m}
            aria-pressed={mood === m}
            onClick={() => {
              setMood(m);
              setAutoMood(false);
            }}
          >
            {m === "Smile"
              ? "☺"
              : m === "Wave"
                ? "✋"
                : m === "Sleep"
                  ? "☾"
                  : m === "Snack"
                    ? "◒"
                    : "☕"}{" "}
            {m}
          </button>
        ))}
      </div>
      {custom && board !== "Cixy Studio" && customization}
      <div className="cixy-signoff">
        STRATEGY <span>·</span> COMMUNICATION <span>·</span> YOUR NEXT CHAPTER
      </div>
    </section>
  );
  const date = calendarMonth
    ? new Date(calendarMonth + "-01T12:00")
    : new Date();
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const calendar = (
    <>
      <div className="calendar-nav">
        <button
          aria-label="Previous month"
          onClick={() => {
            const d = new Date(date);
            d.setMonth(d.getMonth() - 1);
            setCalendarMonth(
              d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
            );
          }}
        >
          ‹
        </button>
        <strong>
          {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </strong>
        <button
          aria-label="Next month"
          onClick={() => {
            const d = new Date(date);
            d.setMonth(d.getMonth() + 1);
            setCalendarMonth(
              d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
            );
          }}
        >
          ›
        </button>
      </div>
      <div className="calendar-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <small key={i}>{d}</small>
        ))}
        {Array.from({ length: date.getDay() }, (_, i) => (
          <span key={"blank" + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = calendarMonth + "-" + String(i + 1).padStart(2, "0");
          return (
            <button
              key={d}
              aria-pressed={selectedDate === d}
              className={selectedDate === d ? "selected" : ""}
              onClick={() => {
                setSelectedDate(d);
                if (board === "Overview") go("Calendar");
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </>
  );
  const visibleKind = boardKind[board];
  const visible = visibleKind
    ? byKind(visibleKind).filter(
        (r) =>
          JSON.stringify(r.data).toLowerCase().includes(query.toLowerCase()) &&
          (stage === "All" ||
            r.data.stage === stage ||
            r.data.status === stage),
      )
    : [];
  const pickTheme = (next: DeskTheme) => {
    setTheme(next);
    setLook((prev) => applyThemeCoat(prev, next));
  };
  return (
    <div className="renoxis" data-theme={theme}>
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <Link className="brand" href="/">
          <svg viewBox="0 0 64 60" aria-hidden="true">
            <path
              d="M10 53V20L32 5l22 15v33M22 45V25h12q17 0 8 13l10 13M23 38h12"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinejoin="round"
            />
          </svg>
          <strong>RENOXIS</strong>
          <small>People. Properties. A brighter tomorrow.</small>
        </Link>
        <nav aria-label="Main navigation">
          {boards.map((b, i) => (
            <button
              key={b}
              className={board === b ? "current" : ""}
              aria-current={board === b ? "page" : undefined}
              onClick={() => go(b)}
            >
              <span aria-hidden="true">{symbols[i]}</span>
              {b === "Overview" ? "Command Desk" : b}
            </button>
          ))}
        </nav>
        <div className="sidebar-theme" role="group" aria-label="Desk theme">
          <span className="theme-label">Theme</span>
          <div className="theme-swatches">
            {(Object.keys(themes) as DeskTheme[]).map((id) => (
              <button
                key={id}
                type="button"
                className={"theme-swatch theme-" + id + (theme === id ? " current" : "")}
                aria-pressed={theme === id}
                title={themes[id].label}
                onClick={() => pickTheme(id)}
              >
                <span className="swatch-dot" aria-hidden="true" />
                {themes[id].label}
              </button>
            ))}
          </div>
        </div>
        <div className="sidebar-quote">
          <span>Build.</span>
          <span>Connect.</span>
          <span>Change lives.</span>
          <hr />
          <strong>PART OF APIXIS</strong>
          <small className="company-line">A Apixis Company</small>
          <small>Real estate without limits.</small>
        </div>
        <div className="sidebar-account">{accountControl}</div>
      </aside>
      <div className="desk">
        <header className="topbar">
          <button
            className="menu-toggle"
            aria-label="Toggle menu"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            ☰
          </button>
          <div className="greeting">
            <span>☀</span>
            <div>
              <h1>Hello, {name}</h1>
              <p>Same vision. A brighter day.</p>
            </div>
          </div>
          <label className="global-search">
            <span>⌕</span>
            <input
              aria-label="Search workspace"
              placeholder="Search your workspace…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
          </label>
          <div className="top-actions">
            <button
              className="primary"
              onClick={() => add(boardKind[board] || "task")}
            >
              ＋ Add new
            </button>
            <button
              className="account-button"
              onClick={preview ? ask : () => go("Connections")}
            >
              <span>{preview ? "↗" : name.slice(0, 1).toUpperCase()}</span>
              {preview ? "Sign in" : name}
            </button>
          </div>
        </header>
        <nav className="workspace-tabs" aria-label="Quick navigation">
          {(
            [
              "Overview",
              "Calendar",
              "Leads",
              "Properties",
              "Social Studio",
              "Renovation Studio",
            ] as Board[]
          ).map((b, i) => (
            <button
              key={b}
              className={board === b ? "active" : ""}
              onClick={() => go(b)}
            >
              {
                [
                  "Overview",
                  "My Day",
                  "Pipeline",
                  "Properties",
                  "Marketing",
                  "Renovations",
                ][i]
              }
            </button>
          ))}
          <span>Dream homes. Real progress.</span>
        </nav>
        <main id="workspace">

          {!preview && seat !== "active" && (
            <section className="desk-panel billing-gate" id="billing-gate">
              <header>
                <h2>
                  {seat === "signed_inactive"
                    ? "Activate Renoxis"
                    : "Keep Renoxis running"}
                </h2>
              </header>
              <p>
                {seat === "signed_inactive"
                  ? "One-time activate is 5,000 Ixis ($50) on Apixis Wallet. Chat basics are included in the monthly seat; heavy Cixy actions still meter the office ledger."
                  : "Monthly seat is 5,000 Ixis ($50/mo) on Apixis Wallet. Your activate is on file; renew to unlock writes and Cixy chat."}
              </p>
              <div className="actions">
                {seat === "signed_inactive" ? (
                  <a className="primary" href={activateHref}>
                    {activateCopy()}
                  </a>
                ) : (
                  <a className="primary" href={renewHref}>
                    {renewCopy()}
                  </a>
                )}
                <a className="soft-button" href={walletHref}>
                  Buy Ixis
                </a>
              </div>
              <p className="muted">
                Wallet catalog is live. Seat unlocks after redeem capture —
                until then entitlements stay empty (no invented balances).
                The Wallet catalog is live, but this seat remains blocked
                until capture is persisted or a hub-admin beta grant is set.
                Renoxis never takes a card.
              </p>
              <p className="muted">
                No browser action can unlock this seat. Access comes only from
                captured Wallet entitlement or a server-side admin beta grant.
              </p>
            </section>
          )}

          <div className="workspace-status">
            <span>
              <i className={preview ? "dot muted-dot" : "dot"} />
              {preview
                ? "Welcome — sign in to build your workspace"
                : loading
                  ? "Loading your workspace…"
                  : error
                    ? "Workspace needs attention"
                    : "Your private workspace"}
            </span>
            <div>
              <button
                onClick={() => void reload()}
                disabled={loading || preview}
              >
                ↻ Refresh
              </button>
              <button
                onClick={exportData}
                disabled={preview || loading || !!error}
              >
                Export
              </button>
            </div>
          </div>
          {error && (
            <div className="notice error" role="alert">
              {error}
              <button onClick={() => void reload()}>Retry</button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}
          {query.trim() && (
            <Panel title="Search results">
              {records
                .filter((r) =>
                  JSON.stringify(r.data)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .slice(0, 20)
                .map((r) => (
                  <button
                    className="search-result"
                    key={r.id}
                    onClick={() => add(r.kind, r)}
                  >
                    <span>{definitions[r.kind].label}</span>
                    <strong>{r.data.title}</strong>
                    <span>Open ↗</span>
                  </button>
                ))}
              {!records.some((r) =>
                JSON.stringify(r.data)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) && (
                <p className="muted">
                  No saved records match. FAQ questions are searchable on the
                  FAQs tab.
                </p>
              )}
            </Panel>
          )}
          {board === "Overview" ? (
            <>
              <div className="overview-grid">
                <div className="left-column">
                  <Panel title="Inbox" action={() => go("Email")}>
                    {inbox}
                  </Panel>
                  <Panel title="My Day" action={() => go("Calendar")}>
                    {schedule}
                  </Panel>
                  <Panel title="Calendar" action={() => go("Calendar")}>
                    {calendar}
                  </Panel>
                </div>
                {cixy}
                <div className="right-column">
                  <Panel title="Hot Property Leads" action={() => go("Leads")}>
                    {leadList}
                  </Panel>
                  <Panel
                    title="Active Listings"
                    action={() => go("Properties")}
                  >
                    {propertyCards}
                  </Panel>
                  <Panel title="Tasks" action={() => go("Calendar")}>
                    {taskList}
                  </Panel>
                  <button
                    className="renovation-tile"
                    onClick={() => go("Renovation Studio")}
                  >
                    <span>✧ RENOVATION STUDIO</span>
                    <strong>See what’s possible.</strong>
                    <p>Shape the plan. Build the next chapter.</p>
                    <b>Create a project ↗</b>
                  </button>
                </div>
              </div>
              <section className="bottom-strip">
                <div className="pipeline">
                  <strong>⌁ Lead Pipeline</strong>
                  <div>
                    {stages.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          go("Leads");
                          setStage(s);
                        }}
                      >
                        <small>{s}</small>
                        <b>
                          {loading
                            ? "—"
                            : leads.filter((r) => (r.data.stage || "New") === s)
                                .length}
                        </b>
                      </button>
                    ))}
                  </div>
                </div>
                <button className="forecast" onClick={() => go("Analytics")}>
                  <small>▥ Commission Forecast</small>
                  <strong>{loading ? "—" : money(stats.forecast)}</strong>
                  <span>From your saved transactions</span>
                </button>
                <button className="forecast" onClick={() => go("Calendar")}>
                  <small>✓ Tasks</small>
                  <strong>{stats.tasks} open</strong>
                  <span>View your next steps ↗</span>
                </button>
                <div className="forecast wallet">
                  <small>✦ Apixis · Ixis</small>
                  <strong>
                    {firm?.office
                      ? seesFirmBalance(firm.office.role)
                        ? `${firm.office.balance ?? 0} Ixis`
                        : "Billed to office"
                      : "Cixy Essentials"}
                  </strong>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => go(firm?.office ? "Team" : "Cixy Studio")}
                  >
                    {firm?.office ? "Office ledger ↗" : "Explore customization ↗"}
                  </button>
                  <span>
                    <a href={walletHref}>Buy Ixis</a>
                  </span>
                </div>
              </section>
            </>
          ) : null}
          {board !== "Overview" && (
            <div className="board-title">
              <div>
                <span className="eyebrow">YOUR RENOXIS WORKSPACE</span>
                <h1>{board}</h1>
              </div>
              <div className="actions">
                {visibleKind && (
                  <button className="primary" onClick={() => add(visibleKind)}>
                    ＋ Add {definitions[visibleKind].label.toLowerCase()}
                  </button>
                )}
                {board === "Properties" && (
                  <Link className="soft-button" href="/listings/generate">
                    Generate listing copy ↗
                  </Link>
                )}
                {board === "Calendar" && (
                  <button onClick={() => add("task")}>＋ Add task</button>
                )}
              </div>
            </div>
          )}
          {board === "Calendar" && (
            <div className="two-column">
              <Panel title="Choose a day">
                {calendar}
                <h3>{selectedDate}</h3>
                {schedule}
              </Panel>
              <Panel title="Tasks">{taskList}</Panel>
              <Panel title="Google Calendar">
                <button disabled={busy} onClick={() => void sync("calendar")}>
                  Refresh Google Calendar
                </button>
                {googleEvents.map((e) => (
                  <div className="record-row" key={e.id}>
                    <strong>{e.summary || "Untitled event"}</strong>
                    <span>
                      {e.start.dateTime
                        ? new Date(e.start.dateTime).toLocaleString()
                        : e.start.date}
                    </span>
                  </div>
                ))}
                {!googleEvents.length && (
                  <p className="muted">
                    Connect Google, then refresh to load upcoming events.
                  </p>
                )}
              </Panel>
            </div>
          )}
          {board === "Email" && (
            <Panel title="Google inbox">
              <div className="actions">
                <button disabled={busy} onClick={() => void sync("inbox")}>
                  Refresh inbox
                </button>
                <button onClick={() => go("Connections")}>
                  Manage connection
                </button>
              </div>
              {inbox}
              <p className="muted">
                Read-only inbox. Messages open in Gmail. Email drafts below stay
                in Renoxis.
              </p>
            </Panel>
          )}
          {board === "Properties" && propertyCards}
          {firm?.office &&
            canRollup(firm.office.role) &&
            board !== "Overview" &&
            board !== "Team" && (
              <div className="filter-row">
                <button
                  className={scope === "book" ? "selected" : ""}
                  onClick={() => {
                    setScope("book");
                    void reload(officeId, "book");
                  }}
                >
                  My book
                </button>
                <button
                  className={scope === "team" ? "selected" : ""}
                  onClick={() => {
                    setScope("team");
                    void reload(officeId, "team");
                  }}
                >
                  Office rollup
                </button>
              </div>
            )}
          {(board === "Leads" || board === "Transactions") && (
            <div className="filter-row">
              {[
                "All",
                ...stages,
                ...(board === "Transactions" ? ["Cancelled"] : []),
              ].map((s) => (
                <button
                  key={s}
                  className={stage === s ? "selected" : ""}
                  onClick={() => setStage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {visibleKind && (
            <Panel
              title={
                board === "Calendar"
                  ? "All appointments"
                  : board === "Email"
                    ? "Saved email drafts"
                    : board === "Properties"
                      ? "Property records"
                      : board === "Documents"
                        ? "Saved document links"
                        : board
              }
            >
              <div className="record-list">
                {visible.length ? (
                  visible.map((r) => (
                    <article className="record-row" key={r.id}>
                      <div>
                        <button
                          className="record-name"
                          onClick={() => add(r.kind, r)}
                        >
                          {r.data.title}
                        </button>
                        <div className="record-meta">
                          {r.data.stage || r.data.status ? (
                            <span className="tag">
                              {r.data.stage || r.data.status}
                            </span>
                          ) : null}
                          {r.data.email && (
                            <a href={"mailto:" + r.data.email}>
                              {r.data.email}
                            </a>
                          )}
                          {r.data.price !== undefined && (
                            <b>{money(r.data.price)}</b>
                          )}
                          {r.data.start && (
                            <span>
                              {new Date(text(r.data.start)).toLocaleString()}
                            </span>
                          )}
                          {r.data.commission !== undefined && (
                            <span>Commission: {money(r.data.commission)}</span>
                          )}
                        </div>
                        {r.data.notes && (
                          <p className="record-notes">{r.data.notes}</p>
                        )}
                        {r.data.progress !== undefined && (
                          <progress value={Number(r.data.progress)} max={100} />
                        )}
                      </div>
                      <div className="record-actions">
                        {r.data.sourceUrl && (
                          <a
                            className="soft-button"
                            href={text(r.data.sourceUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open link ↗
                          </a>
                        )}
                        {(r.kind === "lead" || r.kind === "client") && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              void task("Follow up: " + r.data.title)
                            }
                          >
                            Follow up
                          </button>
                        )}
                        {r.kind === "event" && (
                          <button
                            disabled={busy}
                            onClick={() => void publish(r)}
                          >
                            Review → Google
                          </button>
                        )}
                        <button disabled={busy} onClick={() => add(r.kind, r)}>
                          Edit
                        </button>
                        <button
                          disabled={busy}
                          className="danger-text"
                          onClick={() => void remove(r)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <Empty
                    title={
                      query || stage !== "All"
                        ? "No matching records"
                        : "Make room for possibility"
                    }
                    description={
                      query || stage !== "All"
                        ? "Try another search or filter."
                        : "Add your first " +
                          definitions[visibleKind].label.toLowerCase() +
                          " to get started."
                    }
                    action={() => add(visibleKind)}
                  />
                )}
              </div>
            </Panel>
          )}
          {board === "Documents" && (
            <Panel title="Private document vault">
              <input
                hidden
                ref={fileInput}
                type="file"
                accept="application/pdf,image/png,image/jpeg,text/plain"
                onChange={(e) => void upload(e.target.files?.[0])}
              />
              <div className="actions">
                <button
                  disabled={busy}
                  className="primary"
                  onClick={() => (preview ? ask() : fileInput.current?.click())}
                >
                  Upload document
                </button>
                <button onClick={() => void loadFiles()}>Refresh files</button>
              </div>
              <p className="muted">
                PDF, PNG, JPG or text · up to 4 MB · private to your account
              </p>
              {files.map((f) => (
                <div className="record-row" key={f.id}>
                  <span>{f.name.slice(37)}</span>
                  <div className="actions">
                    <button
                      onClick={async () => {
                        try {
                          const d = await request(
                            "/api/documents?path=" +
                              encodeURIComponent(userId + "/" + f.name),
                          );
                          window.location.assign(d.url);
                        } catch (e) {
                          setNotice(
                            e instanceof Error ? e.message : "Open failed.",
                          );
                        }
                      }}
                    >
                      Open
                    </button>
                    <button
                      disabled={busy}
                      onClick={async () => {
                        if (!confirm("Permanently delete this uploaded file?"))
                          return;
                        setBusy(true);
                        try {
                          await request("/api/documents", {
                            method: "DELETE",
                            body: JSON.stringify({
                              path: userId + "/" + f.name,
                            }),
                          });
                          await loadFiles();
                        } catch (e) {
                          setNotice(
                            e instanceof Error ? e.message : "Delete failed.",
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </Panel>
          )}
          {board === "Renovation Studio" && (
            <Panel title="Plan the transformation">
              <p>
                Save room details, scope, materials and a budget above. Ask Cixy
                to help refine the brief. Photorealistic before-and-after
                generation is not connected yet.
              </p>
              <button onClick={ask}>Plan with Cixy ✦</button>
            </Panel>
          )}
          {board === "Social Studio" && (
            <Panel title="From draft to a new conversation">
              <p>
                Save and edit captions above. Ask Cixy for help, then copy your
                reviewed draft to your social platform. Automatic publishing is
                not connected.
              </p>
              <button onClick={ask}>Draft with Cixy ✦</button>
            </Panel>
          )}
          {board === "Analytics" && (
            <>
              <div className="analytics-grid">
                {[
                  [
                    "Expected commission",
                    money(stats.forecast),
                    "Transactions",
                  ],
                  ["Closed deals", stats.closed, "Transactions"],
                  ["Properties", properties.length, "Properties"],
                  ["Open tasks", stats.tasks, "Calendar"],
                ].map(([label, value, b]) => (
                  <button key={label} onClick={() => go(b as Board)}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <small>View records ↗</small>
                  </button>
                ))}
              </div>
              <Panel title="Your pipeline">
                {stages.map((s) => (
                  <button
                    className="analytics-row"
                    key={s}
                    onClick={() => {
                      go("Leads");
                      setStage(s);
                    }}
                  >
                    <span>{s}</span>
                    <meter
                      min="0"
                      max={Math.max(leads.length, 1)}
                      value={
                        leads.filter((r) => (r.data.stage || "New") === s)
                          .length
                      }
                    />
                    <b>
                      {
                        leads.filter((r) => (r.data.stage || "New") === s)
                          .length
                      }
                    </b>
                  </button>
                ))}
                <p className="muted">
                  Expected commission comes from your entries, excludes
                  cancelled transactions, and is not a cash balance. A closed
                  deal also records a 5% platform cut as pending. Nothing is
                  collected here. Marketing metrics appear only when a verified
                  source is connected.
                </p>
              </Panel>
            </>
          )}
          {board === "Cixy Studio" && (
            <>
              <div className="studio-grid">
                {cixy}
                <Panel title="Cixy Essentials"><div id="cixy-settings">{customization}</div></Panel>
              </div>
              <div className="section-title">
                <span className="eyebrow">THE CIXY COLLECTION</span>
                <h2>A workspace with your personality.</h2>
                <p>
                  Essentials are always owned — customize tints above. Premium
                  collections stay Coming soon until an Ixis price is set. Buy
                  Ixis once below for packs in Apixis Wallet; this page does not
                  charge a card.
                </p>
                <WalletLinks href={walletHref} />
              </div>
              <div className="catalog-grid">
                {catalog.map((item, i) => (
                  <article
                    className={"catalog-card catalog-" + i}
                    key={item.id}
                  >
                    <div className="catalog-art">
                      {["✦", "♧", "☀", "▥", "❧", "◈", "♡", "☕"][i]}
                    </div>
                    <span className="tag">{item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <strong>{catalogPriceLabel(item.price)}</strong>
                    {ownsCatalogItem(wardrobe, item.id) ? (
                      <>
                        <span className="tag owned-tag">Owned</span>
                        <button
                          onClick={() => {
                            if (item.id === ESSENTIALS_ID) {
                              document
                                .getElementById("cixy-settings")
                                ?.scrollIntoView({ behavior: "smooth" });
                            } else {
                              setNotice(
                                item.name +
                                  " is in " +
                                  cixyName +
                                  "'s wardrobe. Layered PNG pack lands next.",
                              );
                            }
                          }}
                        >
                          {item.id === ESSENTIALS_ID
                            ? "Customize Essentials"
                            : "In wardrobe"}
                        </button>
                      </>
                    ) : item.price == null ? (
                      <span className="coming-soon">Coming soon</span>
                    ) : (
                      <a className="catalog-buy" href={walletHref}>
                        Buy on Wallet
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
          {board === "Team" && (
            <TeamDesk
              preview={preview}
              firm={firm}
              scope={scope}
              busy={busy}
              onNotice={setNotice}
              onScope={(view) => {
                setScope(view);
                void reload(officeId, view);
              }}
              onOffice={(id) => {
                void (async () => {
                  const payload = await loadFirm(id);
                  const next =
                    payload?.office &&
                    (payload.office.role === "owner" ||
                      payload.office.role === "broker")
                      ? scope
                      : "book";
                  setScope(next);
                  await reload(id, next);
                })();
              }}
              onChanged={() => {
                void (async () => {
                  await loadFirm(officeId);
                  await reload(officeId, scope);
                })();
              }}
              walletHref={walletHref}
            />
          )}
          {board === "Connections" && (
            <>
              <section className="desk-panel billing-gate">
                <header>
                  <h2>Seat &amp; Ixis</h2>
                </header>
                <p>
                  Status:{" "}
                  <strong>
                    {seat === "active"
                      ? "Active"
                      : seat === "activated_lapsed"
                        ? "Activated · month ended"
                        : preview
                          ? "Sign in to activate"
                          : "Not activated"}
                  </strong>
                  . Activate $50 (5,000 Ixis) once; Keep running $50/mo
                  (5,000 Ixis). Heavy Cixy stays metered on the office ledger
                  (lookup 25 · email 50 · offer 100). Chat basics are in the
                  seat. Cash buy stays on Apixis Wallet — no Renoxis Stripe.
                </p>
                <div className="actions">
                  <a className="primary" href={activateHref}>
                    {activateCopy()}
                  </a>
                  <a className="soft-button" href={renewHref}>
                    {renewCopy()}
                  </a>
                  <a className="soft-button" href={walletHref}>
                    Buy Ixis
                  </a>
                </div>
                {!preview && seat !== "active" && (
                  <p className="muted">
                    Access remains blocked until Wallet capture is persisted or
                    a hub-admin beta grant is set on the server.
                  </p>
                )}
              </section>
              <Panel title="Connections & preferences">
                <CixySetup
                  account={account}
                  settings={settings}
                  status={connections}
                  preview={preview}
                  refresh={refreshConnections}
                  walletHref={walletHref}
                  save={async (v) => {
                    await write("settings", v, settings);
                  }}
                />
              </Panel>
            </>
          )}
          {board === "FAQs" && (
            <div className="faq-layout">
              <div>
                <span className="eyebrow">A LITTLE CLARITY</span>
                <h2>
                  Good questions.
                  <br />
                  Clear answers.
                </h2>
                <p>Everything you need to settle into your new workspace.</p>
                <button className="primary" onClick={ask}>
                  Ask Cixy ✦
                </button>
              </div>
              <section className="faq-list">
                {faqs
                  .filter(([q, a]) =>
                    (q + a).toLowerCase().includes(query.toLowerCase()),
                  )
                  .map(([q, a]) => (
                    <details key={q}>
                      <summary>{q}</summary>
                      <p>{a}</p>
                    </details>
                  ))}
              </section>
            </div>
          )}
          <footer>
            <span>
              RENOXIS <b>·</b> A Apixis Company <b>·</b> People. Properties. A
              brighter tomorrow.
            </span>
            <div>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <button onClick={() => go("FAQs")}>FAQs</button>
              <button onClick={() => go("Connections")}>Connections</button>
              <a href={walletHref}>Wallet</a>
              <button onClick={() => setInstallMessage(!installMessage)}>
                Install app ↗
              </button>
            </div>
          </footer>
          {installMessage && (
            <div className="notice">
              iPhone: Safari → Share → Add to Home Screen. Android / desktop:
              use your browser’s Install app option. Internet is required.
              <button
                aria-label="Close install instructions"
                onClick={() => setInstallMessage(false)}
              >
                ×
              </button>
            </div>
          )}
        </main>
      </div>
      <dialog className="editor-dialog" ref={editor}>
        <header>
          <h2>
            {editing ? "Edit" : "Add"}{" "}
            {definitions[formKind].label.toLowerCase()}
          </h2>
          <button
            aria-label="Close editor"
            disabled={busy}
            onClick={() => editor.current?.close()}
          >
            ×
          </button>
        </header>
        <form
          key={(editing?.id || "new") + formKind}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setFormError("");
            const form = new FormData(e.currentTarget);
            const data: Values = {};
            for (const field of definitions[formKind].fields) {
              const v = form.get(field);
              if (field === "done") {
                data[field] = v === "on";
                continue;
              }
              if (v === null || v === "") continue;
              if (
                [
                  "price",
                  "beds",
                  "baths",
                  "budget",
                  "commission",
                  "progress",
                ].includes(field)
              )
                data[field] = Number(v);
              else if (["start", "end"].includes(field))
                data[field] = new Date(String(v)).toISOString();
              else data[field] = String(v);
            }
            try {
              const saved = await write(formKind, data, editing || undefined);
              editor.current?.close();
              setNotice(
                saved.platformCommission?.ok
                  ? "Saved. A 5% platform commission is pending. Nothing was collected."
                  : "Saved to your account.",
              );
            } catch (e) {
              setFormError(e instanceof Error ? e.message : "Save failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-grid">
            {definitions[formKind].fields.map((field) => {
              const v = editing?.data[field];
              if (field === "done")
                return (
                  <label className="check-label" key={field}>
                    <input name={field} type="checkbox" defaultChecked={!!v} />
                    Completed
                  </label>
                );
              if (field === "stage" || field === "status") {
                const choices =
                  field === "stage" || formKind === "transaction"
                    ? [
                        ...stages,
                        ...(formKind === "transaction" ? ["Cancelled"] : []),
                      ]
                    : formKind === "property"
                      ? ["Active", "Under contract", "Sold", "Off market"]
                      : formKind === "social"
                        ? ["Draft", "Ready for review", "Published manually"]
                        : ["Planning", "In progress", "Complete"];
                return (
                  <label className="field" key={field}>
                    {labels[field]}
                    <select name={field} defaultValue={text(v) || choices[0]}>
                      {choices.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                );
              }
              return (
                <label
                  className={"field " + (field === "notes" ? "span-two" : "")}
                  key={field}
                >
                  {labels[field] || field}
                  {field === "notes" ? (
                    <textarea
                      name={field}
                      maxLength={10000}
                      defaultValue={text(v)}
                      rows={5}
                    />
                  ) : (
                    <input
                      name={field}
                      required={["title", "start", "end"].includes(field)}
                      maxLength={field === "title" ? 200 : 1000}
                      type={
                        [
                          "price",
                          "beds",
                          "baths",
                          "budget",
                          "commission",
                          "progress",
                        ].includes(field)
                          ? "number"
                          : field === "email"
                            ? "email"
                            : field === "sourceUrl"
                              ? "url"
                              : ["start", "end"].includes(field)
                                ? "datetime-local"
                                : field === "due"
                                  ? "date"
                                  : "text"
                      }
                      min={0}
                      max={field === "progress" ? 100 : undefined}
                      step="any"
                      defaultValue={
                        ["start", "end"].includes(field) && v
                          ? new Date(
                              Date.parse(text(v)) -
                                new Date(text(v)).getTimezoneOffset() * 60000,
                            )
                              .toISOString()
                              .slice(0, 16)
                          : text(v)
                      }
                    />
                  )}
                </label>
              );
            })}
          </div>
          {formError && (
            <p role="alert" className="form-error">
              {formError}
            </p>
          )}
          <div className="actions">
            <button className="primary" disabled={busy}>
              {busy
                ? "Saving…"
                : "Save " + definitions[formKind].label.toLowerCase()}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => editor.current?.close()}
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
      <dialog className="chat-dialog" ref={chatDialog}>
        <header>
          <h2>{preview ? "Welcome to Renoxis" : "Cixy · Your assistant"}</h2>
          <button
            aria-label="Close chat"
            onClick={() => chatDialog.current?.close()}
          >
            ×
          </button>
        </header>
        {preview ? (
          <>
            <p>Sign in to save your workspace and chat with Cixy.</p>
            {loginForm}
          </>
        ) : !cixyOpen ? (
          <>
            <p>
              {seat === "signed_inactive"
                ? "Activate your seat to chat with Cixy. Buy Ixis on Apixis Wallet — Renoxis does not take a card."
                : "Renew Keep running to chat with Cixy. Monthly seat is 5,000 Ixis ($50)."}
            </p>
            <div className="actions">
              <a
                className="primary"
                href={seat === "signed_inactive" ? activateHref : renewHref}
              >
                {seat === "signed_inactive" ? activateCopy() : renewCopy()}
              </a>
            </div>
          </>
        ) : activeChat ? (
          <Chat key={cixyName} assistantName={cixyName} />
        ) : null}
      </dialog>
    </div>
  );
}
