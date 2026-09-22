import assert from "node:assert/strict";
import { test } from "node:test";
import { parseChatMarkdown, splitBold } from "../lib/renoxis/chat-markdown.ts";

test("splitBold turns **text** into a bold segment", () => {
  assert.deepEqual(splitBold("**Your role** matters"), [
    { bold: true, text: "Your role" },
    { bold: false, text: " matters" },
  ]);
});

test("parseChatMarkdown builds list and paragraph blocks", () => {
  assert.deepEqual(parseChatMarkdown("**Your role**\n\n- one\n- two"), [
    { type: "p", text: "**Your role**" },
    { type: "ul", items: ["one", "two"] },
  ]);
});
