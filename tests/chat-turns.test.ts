import assert from "node:assert/strict";
import { test } from "node:test";
import { chatTurnsForApi } from "../lib/renoxis/chat-turns.ts";

test("chatTurnsForApi strips leading welcome assistant bubble", () => {
  const out = chatTurnsForApi([
    { role: "assistant", content: "As-salamu alaykum. I'm Cixy." },
    { role: "user", content: "hi cixy" },
  ]);
  assert.deepEqual(out, [{ role: "user", content: "hi cixy" }]);
  assert.equal(out[0]?.role, "user");
});

test("chatTurnsForApi keeps later assistant turns after a user turn", () => {
  const out = chatTurnsForApi([
    { role: "assistant", content: "Welcome" },
    { role: "user", content: "hi" },
    { role: "assistant", content: "Hello!" },
    { role: "user", content: "help with a listing" },
  ]);
  assert.deepEqual(out, [
    { role: "user", content: "hi" },
    { role: "assistant", content: "Hello!" },
    { role: "user", content: "help with a listing" },
  ]);
});

test("chatTurnsForApi drops blank content", () => {
  assert.deepEqual(
    chatTurnsForApi([
      { role: "assistant", content: "   " },
      { role: "user", content: " hi " },
    ]),
    [{ role: "user", content: "hi" }],
  );
});
