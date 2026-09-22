"use client";

import { useState, useRef, useEffect } from "react";
import { chatTurnsForApi } from "@/lib/renoxis/chat-turns";
import { renderChatMarkdown } from "./CixyMarkdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function CixyChat({
  assistantName = "Cixy",
}: {
  assistantName?: string;
}) {
  const name = (assistantName || "Cixy").trim() || "Cixy";
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi — I’m ${name}, your real-estate operator desk. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        { role: "assistant", content: reply },
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
        <p>Real-estate operator desk · drafts only — no file or email send from chat</p>
      </div>

      <div className="cixy-chat-thread">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={
              "cixy-chat-row " +
              (msg.role === "user" ? "cixy-chat-row-user" : "cixy-chat-row-assistant")
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
              {msg.role === "assistant"
                ? renderChatMarkdown(msg.content)
                : (
                    <p className="cixy-md-p">{msg.content}</p>
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
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="cixy-chat-composer">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about listings, offers, fair housing…"
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
