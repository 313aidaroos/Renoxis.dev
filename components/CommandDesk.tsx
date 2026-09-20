"use client";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import "./command-desk.css";

const Chat = dynamic(() => import("./CixyChat").then((m) => m.CixyChat), {
  loading: () => <p>Opening Cixy…</p>,
});
const names = [
  "Overview",
  "Email",
  "Calendar",
  "Leads",
  "Clients",
  "Active Listings",
  "Transactions",
  "Renovations",
  "Social Studio",
  "Documents",
  "Analytics",
  "Customize Cixy",
  "Connections",
] as const;
type Board = (typeof names)[number];
const icons = ["▦", "✉", "▣", "◎", "♧", "⌂", "⇄", "✧", "◈", "▤", "↗", "♡", "⚙"];
const homes = [
  {
    id: 1,
    address: "789 Pinecrest Avenue",
    city: "Detroit, MI",
    price: "$425,000",
    beds: 3,
    baths: 2,
    views: 2400,
    saves: 186,
    inquiries: 24,
    status: "Active",
  },
  {
    id: 2,
    address: "456 Oak Ridge Drive",
    city: "Dearborn, MI",
    price: "$365,000",
    beds: 4,
    baths: 3,
    views: 1800,
    saves: 142,
    inquiries: 18,
    status: "Active",
  },
  {
    id: 3,
    address: "6615 Buckingham Avenue",
    city: "Allen Park, MI",
    price: "$215,000",
    beds: 3,
    baths: 2,
    views: 960,
    saves: 84,
    inquiries: 9,
    status: "Under contract",
  },
];
const people = [
  {
    name: "Jasmine Carter",
    home: 1,
    score: 92,
    stage: "Showing",
    note: "Requested a weekend showing; follow up on availability.",
  },
  {
    name: "Marcus Taylor",
    home: 2,
    score: 78,
    stage: "Contacted",
    note: "Relocating next month; requested property details.",
  },
  {
    name: "Alyssa Bennett",
    home: 3,
    score: 64,
    stage: "New",
    note: "Interested in similar homes; this listing is under contract.",
  },
];
const mail = [
  {
    from: "Jasmine Carter",
    subject: "Can we tour Pinecrest this weekend?",
    body: "Hello! We would love to see Pinecrest on Saturday. What times are available?",
  },
  {
    from: "Inspection team",
    subject: "Inspection report ready for review",
    body: "The Buckingham inspection is complete. Please review the report before the contingency deadline.",
  },
  {
    from: "Oak Ridge seller",
    subject: "Listing photos approved",
    body: "The new photos look great. Please prepare the listing copy for our review.",
  },
];
const agenda = [
  ["09:00", "Client call", "Jasmine Carter · Showing request"],
  ["11:00", "Property showing", "456 Oak Ridge Drive"],
  ["14:00", "Inspection review", "6615 Buckingham Avenue"],
  ["16:00", "Closing preparation", "Review outstanding documents"],
];
type Look = {
  outfit: string;
  hair: string;
  skin: string;
  room: string;
  motion: boolean;
};
const original: Look = {
  outfit: "#2159d6",
  hair: "#543427",
  skin: "#f0bf99",
  room: "Skyline office",
  motion: true,
};
function Avatar({ look, small = false }: { look: Look; small?: boolean }) {
  return (
    <div
      className={
        "cixy-scene " +
        look.room.toLowerCase().replaceAll(" ", "-") +
        (look.motion ? " moving" : "") +
        (small ? " mini" : "")
      }
      style={
        {
          "--outfit": look.outfit,
          "--hair": look.hair,
          "--skin": look.skin,
        } as CSSProperties
      }
    >
      <div className="office-window" />
      <div className="office-plant">♧</div>
      <div
        className="avatar"
        role="img"
        aria-label="Cixy animated personal assistant"
      >
        <div className="hair-back" />
        <div className="jacket" />
        <div className="neck" />
        <div className="face">
          <div className="fringe" />
          <div className="eyes">
            <i />
            <i />
          </div>
          <div className="blush" />
          <div className="smile" />
        </div>
        <div className="arm" />
      </div>
      <div className="office-desk" />
      {small ? null : <span className="scene-label">CIXY’S OFFICE</span>}
    </div>
  );
}
function House({ n = 1 }: { n?: number }) {
  return (
    <div
      className={"house-scene house-" + n}
      role="img"
      aria-label="Illustrated sample property — not a real property photograph"
    >
      <div className="cloud" />
      <div className="house">
        <div className="roof" />
        <div className="windows">
          <i />
          <i />
          <i />
        </div>
        <div className="door" />
      </div>
      <span className="garden">♣</span>
    </div>
  );
}
function Panel({
  title,
  children,
  open,
  className = "",
}: {
  title: string;
  children: ReactNode;
  open?: () => void;
  className?: string;
}) {
  return (
    <section className={"desk-panel " + className}>
      <div className="panel-head">
        <h2>{title}</h2>
        {open ? (
          <button onClick={open} aria-label={"Open " + title + " board"}>
            View board ↗
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
export default function CommandDesk({
  preview = false,
  account = "Your account",
  accountControl,
  loginForm,
}: {
  preview?: boolean;
  account?: string;
  accountControl?: ReactNode;
  loginForm?: ReactNode;
}) {
  const [board, setBoard] = useState<Board>("Overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [property, setProperty] = useState<number | null>(null);
  const [look, setLook] = useState<Look>(original);
  const [notice, setNotice] = useState("");
  const [chat, setChat] = useState(false);
  const [email, setEmail] = useState(0);
  const [draft, setDraft] = useState("");
  const [tasks, setTasks] = useState([
    { id: 1, text: "Follow up with Jasmine about Pinecrest", done: false },
    { id: 2, text: "Review Buckingham inspection report", done: false },
    { id: 3, text: "Prepare Oak Ridge listing copy", done: true },
  ]);
  const [newTask, setNewTask] = useState("");
  const [month, setMonth] = useState(0);
  const [day, setDay] = useState(20);
  const [comparison, setComparison] = useState(50);
  const dialog = useRef<HTMLDialogElement>(null);
  const taskInput = useRef<HTMLInputElement>(null);
  const office = useRef<HTMLElement>(null);
  const go = (b: Board) => {
    setBoard(b);
    setQuery("");
    setFilter("All");
    setProperty(null);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const ask = () => {
    setChat(true);
    dialog.current?.showModal();
  };
  const addTask = (text: string) => {
    if (!text.trim()) return;
    setTasks((t) => [...t, { id: Date.now(), text: text.trim(), done: false }]);
    setNewTask("");
    setNotice("Task added to My Day for this visit. No message was sent.");
  };
  const follow = (id: number) => {
    go("Leads");
    setQuery(homes.find((h) => h.id === id)?.address ?? "");
  };
  const openTasks = () => {
    go("Calendar");
    setTimeout(() => taskInput.current?.focus(), 0);
  };
  const saveLook = () => {
    try {
      localStorage.setItem("renoxis-cixy-v1", JSON.stringify(look));
      setNotice(
        "Appearance saved on this device. Use Load saved look on your next visit.",
      );
    } catch {
      setNotice("Browser storage unavailable; changes remain for this visit.");
    }
  };
  const loadLook = () => {
    try {
      const v = JSON.parse(localStorage.getItem("renoxis-cixy-v1") || "null");
      if (
        v &&
        ["outfit", "hair", "skin"].every((k) => /^#[0-9a-f]{6}$/i.test(v[k])) &&
        ["Skyline office", "Coastal studio", "Evening loft"].includes(v.room) &&
        typeof v.motion === "boolean"
      ) {
        setLook(v);
        setNotice("Saved look restored.");
      } else setNotice("No saved look yet.");
    } catch {
      setNotice("Unable to restore the saved look.");
    }
  };
  const taskList = (
    <>
      <form
        className="task-form"
        onSubmit={(e) => {
          e.preventDefault();
          addTask(newTask);
        }}
      >
        <input
          ref={taskInput}
          aria-label="New task"
          placeholder="Add a task…"
          value={newTask}
          maxLength={200}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button className="primary" type="submit">
          Add
        </button>
      </form>
      {tasks.map((t) => (
        <label className={"task-row " + (t.done ? "done" : "")} key={t.id}>
          <input
            type="checkbox"
            checked={t.done}
            onChange={() =>
              setTasks((ts) =>
                ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
              )
            }
          />
          {t.text}
        </label>
      ))}
    </>
  );
  const schedule = (
    <div className="schedule">
      {agenda.map((a) => (
        <button
          key={a[0]}
          onClick={() => {
            go("Calendar");
            setNotice(a[1] + " — " + a[2]);
          }}
        >
          <time>{a[0]}</time>
          <span className="timeline-dot" />
          <span>
            <strong>{a[1]}</strong>
            <small>{a[2]}</small>
          </span>
          <span>↗</span>
        </button>
      ))}
    </div>
  );
  const leadList = (
    <div className="leads-list">
      {people
        .filter((p) =>
          (p.name + " " + homes[p.home - 1].address)
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .map((p) => (
          <article key={p.name}>
            <span className="initials">
              {p.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <div>
              <strong>{p.name}</strong>
              <small>{homes[p.home - 1].address}</small>
              <span className="tag">
                {p.stage} · {p.score}
              </span>
              {board !== "Overview" ? <p>{p.note}</p> : null}
            </div>
            <button
              onClick={() =>
                addTask(
                  "Follow up: " + p.name + " — " + homes[p.home - 1].address,
                )
              }
            >
              Follow up +
            </button>
          </article>
        ))}
    </div>
  );
  const inbox = (
    <>
      {mail.map((m, i) => (
        <button
          className="email-row"
          key={m.subject}
          onClick={() => {
            go("Email");
            setEmail(i);
            setDraft("");
          }}
        >
          <span className="mail-dot" />
          <span>
            <strong>{m.from}</strong>
            <small>{m.subject}</small>
          </span>
          <span>↗</span>
        </button>
      ))}
    </>
  );
  const filtered = homes.filter(
    (h) =>
      (filter === "All" || filter === h.status) &&
      (h.address + " " + h.city).toLowerCase().includes(query.toLowerCase()),
  );
  const listingGrid = (
    <div className="listing-grid">
      {filtered.map((h) => (
        <article key={h.id} className="listing">
          <button
            className="property-image"
            aria-label={"View " + h.address}
            onClick={() => {
              go("Active Listings");
              setProperty(h.id);
            }}
          >
            <House n={h.id} />
          </button>
          <div className="listing-copy">
            <span className="tag">{h.status}</span>
            <h3>{h.price}</h3>
            <button
              className="text-link"
              onClick={() => {
                go("Active Listings");
                setProperty(h.id);
              }}
            >
              {h.address} ↗
            </button>
            <p>
              {h.city} · {h.beds} beds · {h.baths} baths
            </p>
            <div className="listing-stats">
              <span>◉ {h.views.toLocaleString()}</span>
              <span>♡ {h.saves}</span>
              <button onClick={() => follow(h.id)}>
                {h.inquiries} inquiries ↗
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
  const selected = homes.find((h) => h.id === property);
  const date = new Date(2026, 8 + month, 1);
  const count = new Date(2026, 9 + month, 0).getDate();
  const calendar = (
    <>
      <div className="calendar-nav">
        <button
          aria-label="Previous month"
          onClick={() => {
            setMonth((x) => x - 1);
            setDay(1);
          }}
        >
          ←
        </button>
        <strong>
          {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </strong>
        <button
          aria-label="Next month"
          onClick={() => {
            setMonth((x) => x + 1);
            setDay(1);
          }}
        >
          →
        </button>
      </div>
      <div className="calendar-grid">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <small key={d}>{d}</small>
        ))}
        {Array.from({ length: date.getDay() }, (_, i) => (
          <span key={"b" + i} />
        ))}
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            className={day === i + 1 ? "primary" : ""}
            aria-pressed={day === i + 1}
            onClick={() => setDay(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <p className="muted">
        {month === 0 && day === 20
          ? "September 20: sample agenda below."
          : `Selected day ${day}: no connected appointments.`}
      </p>
    </>
  );
  return (
    <div className="renoxis">
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span>
            R<span className="red">.</span>
          </span>
          <strong>RENOXIS</strong>
          <small>PEOPLE. PROPERTY. POSSIBILITY.</small>
        </Link>
        <nav aria-label="Main boards">
          {names.map((b, i) => (
            <button
              key={b}
              className={board === b ? "current" : ""}
              aria-current={board === b ? "page" : undefined}
              onClick={() => go(b)}
            >
              <span>{icons[i]}</span>
              {b === "Overview" ? "Command Desk" : b}
            </button>
          ))}
        </nav>
        <div className="sidebar-end">
          <span>PART OF APIXIS</span>
          <p>Your office. Your next chapter.</p>
          {accountControl}
        </div>
      </aside>
      <header className="topbar">
        <div>
          <small>YOUR REAL ESTATE OFFICE</small>
          <strong>
            {board === "Overview" ? "Welcome to your next big move." : board}
          </strong>
        </div>
        <div className="top-actions">
          <button className="new-task" onClick={openTasks}>
            + New task
          </button>
          <button
            className="pinned-cixy"
            aria-label="Open Cixy assistant"
            onClick={ask}
          >
            <span>
              <b>Cixy</b>
              <small>Your personal assistant</small>
            </span>
            <span>✦</span>
          </button>
        </div>
      </header>
      <main className="workspace" id="workspace">
        <div className="sample-notice">
          DESIGN PREVIEW · Illustrative data, not live account records.{" "}
          <span>
            {preview ? <button onClick={ask}>Sign in →</button> : account}
          </span>
        </div>
        <div className="workspace-toolbar">
          <nav aria-label="Workspace shortcuts">
            {(
              [
                "Overview",
                "Calendar",
                "Leads",
                "Active Listings",
                "Social Studio",
                "Renovations",
              ] as Board[]
            ).map((b, i) => (
              <button
                className={board === b ? "active" : ""}
                onClick={() => go(b)}
                key={b}
              >
                {
                  [
                    "Overview",
                    "My Day",
                    "Pipeline",
                    "Listings",
                    "Marketing",
                    "Renovations",
                  ][i]
                }
              </button>
            ))}
          </nav>
          <label>
            <span className="sr-only">Search properties or leads</span>
            <input
              placeholder="Search properties or leads…"
              value={query}
              onChange={(e) => {
                if (board === "Overview") setBoard("Active Listings");
                setQuery(e.target.value);
              }}
            />
          </label>
        </div>
        {notice ? (
          <div className="notice" role="status">
            {notice}
            <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
              ×
            </button>
          </div>
        ) : null}
        {board === "Overview" ? (
          <>
            <section className="hero">
              <div>
                <span className="eyebrow">TODAY’S COMMAND DESK</span>
                <h1>
                  Less busywork.
                  <br />
                  <em>More home stories.</em>
                </h1>
                <p>All your priorities. A little more possibility.</p>
                <div className="priorities">
                  {[
                    ["03", "Leads to follow up", "Leads"],
                    ["04", "Today’s appointments", "Calendar"],
                    ["01", "Inspection to review", "Transactions"],
                  ].map(([n, t, b]) => (
                    <button key={t} onClick={() => go(b as Board)}>
                      <strong>{n}</strong>
                      <span>{t} ↗</span>
                    </button>
                  ))}
                </div>
                <button
                  className="text-link"
                  onClick={() =>
                    office.current?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Explore your workday ↓
                </button>
              </div>
            </section>
            <div className="pipeline">
              <strong>Your pipeline</strong>
              {[
                "New",
                "Contacted",
                "Showing",
                "Offer",
                "Under contract",
                "Closed",
              ].map((s, i) => (
                <button
                  key={s}
                  onClick={() => {
                    go(i > 2 ? "Transactions" : "Leads");
                    setNotice("Sample pipeline stage: " + s);
                  }}
                >
                  <small>{s}</small>
                  <b>{[24, 18, 11, 6, 4, 12][i]}</b>
                </button>
              ))}
            </div>
            <div className="overview-grid">
              <Panel title="Today’s Schedule" open={() => go("Calendar")}>
                {schedule}
              </Panel>
              <Panel title="Hot Property Leads" open={() => go("Leads")}>
                {leadList}
              </Panel>
              <Panel title="Tasks" open={() => go("Calendar")}>
                {taskList}
              </Panel>
              <Panel
                className="span-two"
                title="Active Listings"
                open={() => go("Active Listings")}
              >
                {listingGrid}
              </Panel>
              <Panel title="Inbox" open={() => go("Email")}>
                {inbox}
              </Panel>
            </div>
            <section className="office-section" ref={office}>
              <div className="section-intro">
                <span className="eyebrow">YOUR WORKDAY, CONNECTED</span>
                <h2>The details that keep you moving.</h2>
                <p>One office. Everything in its place.</p>
              </div>
              <div className="overview-grid">
                <Panel title="Calendar" open={() => go("Calendar")}>
                  {calendar}
                </Panel>
                <Panel title="Transactions" open={() => go("Transactions")}>
                  <h3>Buckingham Avenue</h3>
                  <span className="tag">Under contract</span>
                  <progress value={72} max={100} />
                  <p>72% complete · Appraisal next</p>
                </Panel>
                <Panel title="Renovation Studio" open={() => go("Renovations")}>
                  <div className="room-art">
                    BEFORE <span>AFTER ✧</span>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => go("Renovations")}
                  >
                    Explore a transformation ↗
                  </button>
                </Panel>
              </div>
            </section>
          </>
        ) : null}
        {board === "Active Listings" ? (
          <>
            <div className="board-heading">
              <h1>Active Listings</h1>
              <Link className="primary" href="/listings/generate">
                + Generate listing copy
              </Link>
            </div>
            <div className="actions">
              {["All", "Active", "Under contract"].map((s) => (
                <button
                  className={filter === s ? "primary" : ""}
                  onClick={() => setFilter(s)}
                  key={s}
                >
                  {s}
                </button>
              ))}
            </div>
            {listingGrid}
            {!filtered.length ? <p>No properties match your search.</p> : null}
            {selected ? (
              <Panel title={selected.address}>
                <p>
                  {selected.city} · {selected.price} · {selected.beds} bedrooms
                  · {selected.baths} bathrooms
                </p>
                <p>
                  Sample marketing data: {selected.views} views,{" "}
                  {selected.saves} saves, {selected.inquiries} inquiries.
                  Illustrations are not actual listing photographs.
                </p>
                <div className="actions">
                  <button onClick={() => follow(selected.id)}>
                    Property leads
                  </button>
                  <button
                    onClick={() =>
                      addTask("Schedule showing: " + selected.address)
                    }
                  >
                    Add showing task
                  </button>
                  <Link className="primary" href="/listings/generate">
                    Draft listing
                  </Link>
                  <button onClick={() => setProperty(null)}>
                    Close details
                  </button>
                </div>
              </Panel>
            ) : null}
          </>
        ) : null}
        {board === "Email" ? (
          <div className="two-column">
            <Panel title="Inbox — sample messages">{inbox}</Panel>
            <Panel title={mail[email].subject}>
              <p>From: {mail[email].from}</p>
              <p>{mail[email].body}</p>
              <label className="field">
                Reply draft
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a draft; nothing is sent from this preview."
                />
              </label>
              <div className="actions">
                <button
                  onClick={() =>
                    setDraft(
                      "Thank you for your message. I have noted your request and will follow up shortly to confirm next steps.",
                    )
                  }
                >
                  Insert reply template
                </button>
                <button
                  onClick={() =>
                    addTask("Review reply: " + mail[email].subject)
                  }
                >
                  Create follow-up task
                </button>
              </div>
              <p className="muted">
                Templates are not AI-generated. Email sending is not connected.
              </p>
            </Panel>
          </div>
        ) : null}
        {board === "Calendar" ? (
          <div className="two-column">
            <Panel title="Calendar">
              {calendar}
              {month === 0 && day === 20 ? schedule : null}
            </Panel>
            <Panel title="My Day — tasks">{taskList}</Panel>
          </div>
        ) : null}
        {board === "Leads" || board === "Clients" ? (
          <Panel
            title={
              board === "Leads"
                ? "Property leads & follow-up"
                : "Client relationships"
            }
          >
            {leadList}
            <p className="muted">
              Sample records. Follow-up actions create tasks and never contact a
              person.
            </p>
          </Panel>
        ) : null}
        {board === "Transactions" ? (
          <Panel title="6615 Buckingham Avenue">
            <span className="tag">Sample transaction · Under contract</span>
            <progress value={72} max={100} />
            {[
              "Offer accepted",
              "Inspection review",
              "Appraisal",
              "Financing contingency",
              "Final walkthrough",
              "Closing",
            ].map((s, i) => (
              <div className="detail-row" key={s}>
                <b className="step">{i + 1}</b>
                <div>
                  <strong>{s}</strong>
                  <p>
                    {i === 0
                      ? "Complete"
                      : i === 1
                        ? "Needs review"
                        : "Upcoming — confirm deadlines with your team"}
                  </p>
                </div>
                <button onClick={() => addTask(s + " — Buckingham")}>
                  Add task
                </button>
              </div>
            ))}
          </Panel>
        ) : null}
        {board === "Renovations" ? (
          <Panel title="Renovation planning">
            <p>
              Illustrative comparison — real image generation is not connected.
            </p>
            <div className="room-compare">
              <div className="room-updated">Updated concept</div>
              <div
                className="room-existing"
                style={{ width: comparison + "%" }}
              >
                Existing room
              </div>
            </div>
            <label className="field">
              Before / after slider
              <input
                type="range"
                value={comparison}
                min={0}
                max={100}
                onChange={(e) => setComparison(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Project brief
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Describe the room, budget, and design style…"
              />
            </label>
            <button
              className="primary"
              onClick={() =>
                addTask(
                  "Renovation brief: " + (draft || "Define room and budget"),
                )
              }
            >
              Add brief to tasks
            </button>
          </Panel>
        ) : null}
        {board === "Social Studio" ? (
          <Panel title="Content planning">
            <p>
              Prepare listing announcements for review. Publishing is not
              connected.
            </p>
            <div className="actions">
              {homes.map((h) => (
                <button
                  key={h.id}
                  onClick={() =>
                    setDraft(
                      `Explore ${h.address}, ${h.city}. ${h.beds} bedrooms and ${h.baths} bathrooms, listed at ${h.price}. Contact your agent for details and showing availability.`,
                    )
                  }
                >
                  {h.address}
                </button>
              ))}
            </div>
            <label className="field">
              Caption draft
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <button
              className="primary"
              onClick={() =>
                addTask(
                  "Review social caption: " +
                    (draft || "Write listing announcement"),
                )
              }
            >
              Queue review task
            </button>
          </Panel>
        ) : null}
        {board === "Documents" ? (
          <Panel title="Document checklist">
            {[
              "Listing agreement",
              "Seller disclosures",
              "Inspection report",
              "Appraisal",
              "Closing statement",
            ].map((d) => (
              <div className="detail-row" key={d}>
                <div>
                  <strong>{d}</strong>
                  <p>
                    No file uploaded. Keep sensitive files in your authorized
                    document system.
                  </p>
                </div>
                <button onClick={() => addTask("Request document: " + d)}>
                  Add request task
                </button>
              </div>
            ))}
          </Panel>
        ) : null}
        {board === "Analytics" ? (
          <Panel title="Listing performance — sample data">
            <div className="metrics">
              {[
                ["Views", homes.reduce((n, h) => n + h.views, 0)],
                ["Saves", homes.reduce((n, h) => n + h.saves, 0)],
                ["Inquiries", homes.reduce((n, h) => n + h.inquiries, 0)],
              ].map(([label, n]) => (
                <div key={label}>
                  <small>{label}</small>
                  <strong>{n.toLocaleString()}</strong>
                </div>
              ))}
            </div>
            {homes.map((h) => (
              <div className="detail-row" key={h.id}>
                <span>{h.address}</span>
                <meter min={0} max={3000} value={h.views} />
                <b>{h.views} views</b>
              </div>
            ))}
          </Panel>
        ) : null}
        {board === "Customize Cixy" ? (
          <div className="two-column">
            <Panel title="Appearance & office">
              {(["outfit", "hair", "skin"] as const).map((k) => (
                <label className="field" key={k}>
                  {k === "outfit"
                    ? "Blazer color"
                    : k === "hair"
                      ? "Hair color"
                      : "Skin tone"}
                  <input
                    type="color"
                    value={look[k]}
                    onChange={(e) => setLook({ ...look, [k]: e.target.value })}
                  />
                </label>
              ))}
              <label className="field">
                Office background
                <select
                  value={look.room}
                  onChange={(e) => setLook({ ...look, room: e.target.value })}
                >
                  {["Skyline office", "Coastal studio", "Evening loft"].map(
                    (r) => (
                      <option key={r}>{r}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="task-row">
                <input
                  type="checkbox"
                  checked={look.motion}
                  onChange={(e) =>
                    setLook({ ...look, motion: e.target.checked })
                  }
                />
                Animate Cixy
              </label>
              <div className="actions">
                <button className="primary" onClick={saveLook}>
                  Save appearance
                </button>
                <button onClick={loadLook}>Load saved look</button>
                <button onClick={() => setLook(original)}>Reset preview</button>
              </div>
              <p className="muted">
                Settings are device-local. System reduced-motion preferences
                take priority.
              </p>
            </Panel>
          </div>
        ) : null}
        {board === "Connections" ? (
          <Panel title="Connections & account">
            <p>
              Your existing login, listing generator, and Cixy chat endpoint are
              preserved.
            </p>
            {[
              "Email — not connected",
              "Calendar — not connected",
              "CRM — sample records",
              "Wallet — not connected",
            ].map((s) => (
              <p className="connection" key={s}>
                {s}
              </p>
            ))}
            <div className="actions">
              <button onClick={() => go("Customize Cixy")}>
                Customize Cixy
              </button>
              {preview ? (
                <button className="primary" onClick={ask}>
                  Sign in
                </button>
              ) : (
                <Link className="primary" href="/dashboard">
                  Your dashboard
                </Link>
              )}
              <Link href="/listings/generate">Listing generator →</Link>
            </div>
          </Panel>
        ) : null}
        <footer className="workspace-footer">
          RENOXIS · More possibility, less busywork.{" "}
          <button onClick={() => go("Connections")}>Connection status ↗</button>
        </footer>
      </main>
      <aside className="persistent-cixy" aria-label="Cixy office">
        <div className="panel-head">
          <h2>Cixy</h2>
          <button onClick={() => go("Customize Cixy")}>Customize ♡</button>
        </div>
        <Avatar look={look} />
        <span className="eyebrow">YOUR PERSONAL ASSISTANT</span>
        <h3>
          A little help.
          <br />A lot more possibility.
        </h3>
        <p>Open your schedule, explore a listing, or give me a task.</p>
        <div className="actions">
          <button className="primary" onClick={ask}>
            Chat with Cixy
          </button>
          <button onClick={openTasks}>Give a task</button>
        </div>
        <div className="cixy-status">✦ One assistant, always within reach</div>
      </aside>
      <dialog
        className="chat-dialog"
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="panel-head">
          <h2>Cixy assistant</h2>
          <button
            onClick={() => dialog.current?.close()}
            aria-label="Close Cixy chat"
          >
            Close ×
          </button>
        </div>
        {chat ? (
          preview ? (
            <div>
              <p>
                Sign in to use your existing Cixy connection. Demo boards remain
                available without an account.
              </p>
              {loginForm ?? <Link href="/">Open sign in →</Link>}
            </div>
          ) : (
            <Chat />
          )
        ) : null}
      </dialog>
    </div>
  );
}
