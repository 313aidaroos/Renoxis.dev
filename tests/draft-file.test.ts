import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DRAFT_DISCLAIMER,
  wrapDraftFile,
} from "../lib/renoxis/draft-file.ts";

test("wrapDraftFile labels DRAFT and never claims send", () => {
  const file = wrapDraftFile("generic", "Listing follow-up", "Hello there.");
  assert.match(file.text, /DRAFT ONLY/);
  assert.match(file.text, /Hello there/);
  assert.match(file.text, new RegExp(DRAFT_DISCLAIMER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(file.filename.includes("listing"), true);
  assert.doesNotMatch(file.text, /signed contract sent/i);
});

test("wrapDraftFile rejects empty body", () => {
  assert.throws(() => wrapDraftFile("email_draft", "Hi", "   "), /Write the draft/);
});
