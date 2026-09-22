import type { ReactNode } from "react";
import { parseChatMarkdown, splitBold } from "@/lib/renoxis/chat-markdown";

function Inline({ text }: { text: string }) {
  return (
    <>
      {splitBold(text).map((part, i) =>
        part.bold ? <strong key={i}>{part.text}</strong> : <span key={i}>{part.text}</span>,
      )}
    </>
  );
}

/** Lightweight chat Markdown: paragraphs, lists, **bold**. No HTML. */
export function renderChatMarkdown(content: string): ReactNode {
  const blocks = parseChatMarkdown(content);
  return (
    <div className="cixy-md">
      {blocks.map((block, i) =>
        block.type === "ul" ? (
          <ul key={i} className="cixy-md-list">
            {block.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="cixy-md-p">
            <Inline text={block.text} />
          </p>
        ),
      )}
    </div>
  );
}
