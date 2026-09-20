"use client";
import { useState } from "react";

export default function CixySetup({ account }: { account: string }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(account.includes("@") ? account : "");
  const [provider, setProvider] = useState("Google / Gmail");
  const [links, setLinks] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [review, setReview] = useState(true);
  const [brokerage, setBrokerage] = useState("");
  const [paidTools, setPaidTools] = useState("");
  const [specialty, setSpecialty] = useState("Agent operations");
  const labels = [
    "Your email",
    "Your calendar",
    "Your listings",
    "Your tools",
    "Review setup",
  ];
  function addLink(e: React.FormEvent) {
    e.preventDefault();
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== "https:" || parsed.username || parsed.password)
        throw new Error();
      if (links.includes(parsed.href)) {
        setMessage("That listing is already in your list.");
        return;
      }
      setLinks([...links, parsed.href]);
      setUrl("");
      setMessage(
        "Link added for this visit. Property import is not connected yet.",
      );
    } catch {
      setMessage(
        "Enter a complete public https:// listing link without credentials.",
      );
    }
  }
  return (
    <section className="setup-flow" aria-label="Cixy getting started">
      <span className="eyebrow">CIXY · YOUR PERSONAL SETUP GUIDE</span>
      <h2>Let’s get started. Let’s connect your workspace.</h2>
      <p>
        I’ll help you bring your email, schedule, and property listings
        together. You choose what I can access.
      </p>
      <p className="sample-notice">
        Setup preview: preferences and listing links last for this visit only.
        No inbox is being read and no calendar changes are made.
      </p>
      <nav className="actions" aria-label="Setup steps">
        {labels.map((label, index) => (
          <button
            key={label}
            aria-current={step === index ? "step" : undefined}
            className={step === index ? "primary" : ""}
            onClick={() => {
              setStep(index);
              setMessage("");
            }}
          >
            {index + 1}. {label}
          </button>
        ))}
      </nav>
      {step === 0 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(1);
          }}
        >
          <h3>Which email do you use for real estate?</h3>
          <label>
            Work email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@youragency.com"
            />
          </label>
          <label>
            Email provider
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option>Google / Gmail</option>
              <option>Microsoft / Outlook</option>
            </select>
          </label>
          <p>
            Your email address alone does not grant inbox access. A secure
            provider consent screen must be connected before Cixy can read
            messages. Never enter your email password here.
          </p>
          <button className="primary" type="submit">
            Continue to calendar →
          </button>
        </form>
      ) : null}
      {step === 1 ? (
        <div>
          <h3>Turn email requests into a reviewed schedule</h3>
          <p>
            Planned flow: connect inbox → Cixy identifies showings, meetings and
            deadlines → review date, time, timezone and property → approve
            calendar entry.
          </p>
          <label className="setup-check">
            <input
              type="checkbox"
              checked={review}
              onChange={(e) => setReview(e.target.checked)}
            />
            Ask me before adding an event
          </label>
          {!review ? (
            <p>
              Automatic scheduling is not available. Calendar writes will still
              require review.
            </p>
          ) : null}
          <div className="actions">
            <button
              onClick={() =>
                setMessage(
                  "Google Calendar requires the Renoxis Google OAuth application and calendar permissions to be configured. No connection was made.",
                )
              }
            >
              Set up Google Calendar
            </button>
            <button
              onClick={() =>
                setMessage(
                  "Outlook Calendar requires the Renoxis Microsoft OAuth application and calendar permissions to be configured. No connection was made.",
                )
              }
            >
              Set up Outlook Calendar
            </button>
          </div>
          <p>Connection status: not connected.</p>
          <button
            className="primary"
            onClick={() => {
              setStep(2);
              setMessage("");
            }}
          >
            Continue to listings →
          </button>
        </div>
      ) : null}
      {step === 2 ? (
        <div>
          <h3>Send Cixy your listing links</h3>
          <p>
            Add public links from your brokerage or property listing pages.
            These are your submitted links, separate from the dashboard’s
            example properties.
          </p>
          <form onSubmit={addLink}>
            <label>
              Listing URL
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-brokerage.com/listing/..."
              />
            </label>
            <button type="submit">Add listing link</button>
          </form>
          <ul>
            {links.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noopener noreferrer">
                  {link}
                </a>{" "}
                <button
                  onClick={() =>
                    setLinks(links.filter((item) => item !== link))
                  }
                  aria-label={`Remove ${link}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p>Links are not fetched, analyzed, or permanently saved yet.</p>
          <button
            className="primary"
            onClick={() => {
              setStep(3);
              setMessage("");
            }}
          >
            Choose my tools →
          </button>
        </div>
      ) : null}
      {step === 3 ? (
        <div>
          <h3>Your real-estate specialties and paid tools</h3>
          <label>
            Primary focus
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {[
                "Agent operations",
                "Low-cash real estate strategies",
                "Section 8 / voucher rentals",
                "Wholesaling",
                "Rental investment analysis",
                "Renovation and resale",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Brokerage name
            <input
              value={brokerage}
              onChange={(e) => setBrokerage(e.target.value)}
              placeholder="Your brokerage"
            />
          </label>
          <label>
            Programs you already pay for
            <textarea
              value={paidTools}
              onChange={(e) => setPaidTools(e.target.value)}
              placeholder="Your CRM, MLS, property research or licensed skip-tracing provider"
            />
          </label>
          <p>
            Bring your own licensed accounts. Provider API availability,
            brokerage approval and subscription costs must be checked before
            connecting. No passwords or API keys here.
          </p>
          <p>
            Skip tracing is only for authorized business use with privacy and
            outreach compliance checks—not tenant eligibility decisions,
            harassment, or locating someone to evade their boundaries.
          </p>
          <p>
            Cixy can help compare strategies and estimate deal economics, but
            cannot guarantee profit, zero costs, legal compliance or current
            market data.
          </p>
          <button className="primary" onClick={() => setStep(4)}>
            Review my setup →
          </button>
        </div>
      ) : null}
      {step === 4 ? (
        <div>
          <h3>Your connection checklist</h3>
          <p>Focus: {specialty}</p>
          <p>
            Brokerage: {brokerage || "Not entered"} · Tools:{" "}
            {paidTools || "Not entered"} · Not connected
          </p>
          <p>
            Email: {email || "Not entered"} · {provider} · Not connected
          </p>
          <p>
            Calendar: Not connected · Approval required before event creation
          </p>
          <p>
            Listing links: {links.length} entered this visit · Import pending
          </p>
          <p>
            CRM, documents and analytics: awaiting provider data. Example tiles
            remain labeled until real records are available.
          </p>
          <p>
            Next implementation step: enable provider OAuth, encrypted token
            storage, per-user records, inbox analysis and reviewed calendar
            writes. No setup completion is claimed until these work.
          </p>
          <button
            onClick={() => {
              setStep(0);
              setMessage("");
            }}
          >
            Edit setup
          </button>
        </div>
      ) : null}
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
