"use client";

import { useState, useRef, useEffect } from "react";
import { chatTurnsForApi } from "@/lib/renoxis/chat-turns";
import { DRAFT_DISCLAIMER } from "@/lib/renoxis/draft-file";
import { renderChatMarkdown } from "./CixyMarkdown";

type Message = {
  role: "user" | "assistant";
  content: string;
  draftable?: boolean;
};

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".txt") ? filename : filename + ".txt";
  a.click();
  URL.revokeObjectURL(url);
}

export function CixyChat({
  assistantName = "Cixy",
  officeId = null,
}: {
  assistantName?: string;
  officeId?: string | null;
}) {
  const name = (assistantName || "Cixy").trim() || "Cixy";
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi — I'm ${name}, your real-estate operator desk. How can I help you today?`,
      draftable: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyDraft, setBusyDraft] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, draftNotice]);

  const materialize = async (
    content: string,
    kind: "generic" | "email_draft" | "offer_letter",
    save: boolean,
  ) => {
    const key = kind + ":" + (save ? "save" : "dl") + ":" + content.slice(0, 24);
    setBusyDraft(key);
    setDraftNotice("");
    try {
      const title =
        kind === "offer_letter"
          ? "Offer letter draft"
          : kind === "email_draft"
            ? "Email draft"
            : "Cixy draft";
      const res = await fetch("/api/cixy/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title,
          body: content,
          save,
          ...(officeId ? { brokerageId: officeId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (typeof data?.error === "string" && data.error) ||
            "Could not prepare the draft.",
        );
      }
      if (!save && typeof data.text === "string") {
        downloadText(data.filename || "renoxis-draft.txt", data.text);
      }
      setDraftNotice(
        (typeof data.message === "string" && data.message) ||
          (save
            ? "Draft saved to Documents. Nothing was sent."
            : "Download started. Draft only — nothing was sent."),
      );
    } catch (error) {
      setDraftNotice(
        error instanceof Error ? error.message : "Could not prepare the draft.",
      );
    } finally {
      setBusyDraft(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(nextMessages);
    setLoading(true);
    setDraftNotice("");

    try {
      const turns = chatTurnsForApi(nextMessages);
      if (!turns.length || turns[0].role !== "user") {
        throw new Error(
          name + " needs a real message before she can reply. Please try again.",
        );
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: turns }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          (typeof data?.error === "string" && data.error) ||
            name + " is temporarily unavailable.",
        );
      }

      const reply =
        typeof data?.message === "string" ? data.message.trim() : "";
      if (!reply) {
        throw new Error(
          name + " returned an empty reply. Please try again in a moment.",
        );
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, draftable: true },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : name + " is temporarily unavailable. Please try again.",
          draftable: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cixy-chat">
      <div className="cixy-chat-header">
        <h3>Chat with {name}</h3>
        <p>
          Drafts can download or save to Documents · not signed · not sent
        </p>
      </div>

      <div className="cixy-chat-thread">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={
              "cixy-chat-row " +
              (msg.role === "user"
                ? "cixy-chat-row-user"
                : "cixy-chat-row-assistant")
            }
          >
            <div
              className={
                "cixy-chat-bubble " +
                (msg.role === "user"
                  ? "cixy-chat-bubble-user"
                  : "cixy-chat-bubble-assistant")
              }
            >
              {msg.role === "assistant" ? (
                renderChatMarkdown(msg.content)
              ) : (
                <p className="cixy-md-p">{msg.content}</p>
              )}
              {msg.role === "assistant" && msg.draftable && (
                <div className="cixy-draft-actions">
                  <p className="cixy-draft-note">{DRAFT_DISCLAIMER}</p>
                  <div className="cixy-draft-buttons">
                    <button
                      type="button"
                      disabled={!!busyDraft}
                      onClick={() =>
                        void materialize(msg.content, "generic", false)
                      }
                    >
                      Download .txt
                    </button>
                    <button
                      type="button"
                      disabled={!!busyDraft}
                      onClick={() =>
                        void materialize(msg.content, "generic", true)
                      }
                    >
                      Save to Documents
                    </button>
                    {officeId ? (
                      <>
                        <button
                          type="button"
                          disabled={!!busyDraft}
                          onClick={() =>
                            void materialize(msg.content, "email_draft", true)
                          }
                        >
                          Email draft · 50 Ixis
                        </button>
                        <button
                          type="button"
                          disabled={!!busyDraft}
                          onClick={() =>
                            void materialize(msg.content, "offer_letter", true)
                          }
                        >
                          Offer letter · 100 Ixis
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="cixy-chat-row cixy-chat-row-assistant">
            <div className="cixy-chat-bubble cixy-chat-bubble-assistant cixy-chat-typing">
              <p className="cixy-md-p">{name} is typing…</p>
            </div>
          </div>
        )}
        {draftNotice ? (
          <p className="cixy-draft-status" role="status">
            {draftNotice}
          </p>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="cixy-chat-composer">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a draft, listing plan, offer checklist…"
          disabled={loading}
          aria-label={"Message " + name}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
