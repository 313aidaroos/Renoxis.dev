"use client";

import { useState, useRef, useEffect } from "react";
import { chatTurnsForApi } from "@/lib/renoxis/chat-turns";

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
      content: `As-salamu alaykum. I'm ${name}, your real estate assistant. How can I help you today?`,
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
          name +
            " returned an empty reply. Please try again in a moment.",
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
    <div className="flex flex-col h-[600px]">
      <div className="bg-zinc-100 dark:bg-zinc-900 p-4 border-b border-zinc-300 dark:border-zinc-700">
        <h3 className="font-bold">Chat with {name}</h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Your real-estate operator desk
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-emerald-700 text-white"
                  : "bg-zinc-200 dark:bg-zinc-800 text-foreground"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-200 dark:bg-zinc-800 rounded-lg p-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {name} is typing...
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-zinc-300 dark:border-zinc-700"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about listings, offers, fair housing..."
            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
