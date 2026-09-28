import assert from "node:assert/strict";
import { test } from "node:test";
import { APIXIS_WORLD_ORIGIN, enterApixisUrl } from "../lib/apixis-world.ts";
import {
  RENOXIS_APIXIS_WORLD_URL,
  apixisPromptSeenKey,
  shouldShowApixisPrompt,
} from "../lib/renoxis/apixis-entry.ts";

test("Renoxis enters the Apixis world via www.apixis.dev/enter with from=renoxis", () => {
  assert.equal(APIXIS_WORLD_ORIGIN, "https://www.apixis.dev");
  assert.equal(RENOXIS_APIXIS_WORLD_URL, "https://www.apixis.dev/enter?from=renoxis");
  assert.equal(enterApixisUrl("renoxis"), RENOXIS_APIXIS_WORLD_URL);
  assert.equal(enterApixisUrl(" ReNoXiS "), RENOXIS_APIXIS_WORLD_URL);
});

test("next is kept only for same-origin paths", () => {
  assert.equal(
    enterApixisUrl("renoxis", "/world.html#market"),
    "https://www.apixis.dev/enter?from=renoxis&next=%2Fworld.html%23market",
  );
  for (const bad of ["https://evil.test", "//evil.test", "/\\evil.test", "/a b", "world.html", "/" + "x".repeat(600)]) {
    assert.equal(enterApixisUrl("renoxis", bad), RENOXIS_APIXIS_WORLD_URL, bad);
  }
});

test("unknown products get no from (no back link on Apixis)", () => {
  assert.equal(enterApixisUrl("evil"), "https://www.apixis.dev/enter");
  assert.equal(new URL(enterApixisUrl("renoxis")).host, "www.apixis.dev");
});

test("first-run prompt is tracked per account and shows once", () => {
  assert.equal(apixisPromptSeenKey("Agent@Example.com "), "renoxis-apixis-world-prompt-v1:agent@example.com");
  assert.notEqual(apixisPromptSeenKey("a@x.com"), apixisPromptSeenKey("b@x.com"));
  assert.equal(shouldShowApixisPrompt(null), true);
  assert.equal(shouldShowApixisPrompt(""), true);
  assert.equal(shouldShowApixisPrompt("2026-09-27T00:00:00.000Z"), false);
});
