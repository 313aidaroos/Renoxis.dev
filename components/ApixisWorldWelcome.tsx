"use client";
// One-time "Your agent is ready. Enter the Apixis world" card on the Command Desk.
// Cixy is the guide (not the user's avatar). Grok Developer Bot, 2026-09-28.
import { useState } from "react";
import CixyAvatar from "./CixyAvatar";
import type { Look } from "@/lib/renoxis/customization";
import type { WorldAgentView } from "@/lib/renoxis/world-agent";
import "./apixis-world-welcome.css";

function markSeen(action: "enter" | "dismiss") {
  try {
    void fetch("/api/apixis/world-welcome", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function ApixisWorldWelcome({ view, look, enterHref }: { view: WorldAgentView; look: Look; enterHref: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const ready = view.status === "ready";
  const name = view.agentName || "Your agent";
  return (
    <section className="desk-tour-entry apixis-agent-card" aria-labelledby="apixis-agent-heading" data-state={view.status}>
      <div className="desk-tour-avatar apixis-agent-guide">
        <CixyAvatar look={look} mood="Wave" />
        <span className="apixis-agent-guide-tag">Cixy · your guide</span>
      </div>
      <div className="apixis-agent-copy">
        <span className="eyebrow">{ready ? "APIXIS WORLD · YOUR AGENT IS READY" : "APIXIS WORLD · YOUR OWN AGENT"}</span>
        <h2 id="apixis-agent-heading">
          {ready ? "Your agent is ready. Enter the Apixis world." : "Your own agent is waiting in the Apixis world."}
        </h2>
        <p>
          {ready
            ? "Your Renoxis account came with your own agent in the Apixis world. It starts in the default Apixis body — make its hair, outfit and colors yours once you’re inside. I’ll meet you there and show you around."
            : "Every Renoxis account gets its own agent in the Apixis world. Sign in with Apixis ID and it’s created for you, in the default Apixis body you can make your own. I’ll show you around."}
        </p>
        <ul className="apixis-agent-facts" aria-label="Your agent">
          <li className="apixis-agent-chip"><b aria-hidden="true">✦</b>{ready ? name : "Your agent"}</li>
          <li>200 in-world Ixis to start</li>
          <li>Sign in with Apixis ID</li>
        </ul>
      </div>
      <div className="apixis-agent-actions">
        <a className="primary" href={enterHref} onClick={() => markSeen("enter")}>Enter the Apixis world ↗</a>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            markSeen("dismiss");
            setOpen(false);
          }}
        >
          Not now
        </button>
        <small>You can come back to Renoxis anytime.</small>
      </div>
    </section>
  );
}
