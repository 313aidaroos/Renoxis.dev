import assert from "node:assert/strict";
import { test } from "node:test";
import { workspaceDisplayName } from "../lib/renoxis/records.ts";

test("workspaceDisplayName prefers saved name over email local-part", () => {
  assert.equal(
    workspaceDisplayName("Awad", "alaidaroosawad@gmail.com"),
    "Awad",
  );
  assert.equal(
    workspaceDisplayName("  Awad  ", "alaidaroosawad@gmail.com"),
    "Awad",
  );
});

test("workspaceDisplayName falls back to email local-part until set", () => {
  assert.equal(
    workspaceDisplayName("", "alaidaroosawad@gmail.com"),
    "alaidaroosawad",
  );
  assert.equal(
    workspaceDisplayName(null, "alaidaroosawad@gmail.com"),
    "alaidaroosawad",
  );
});

test("workspaceDisplayName uses there in preview", () => {
  assert.equal(workspaceDisplayName("", "x@y.com", true), "there");
  assert.equal(workspaceDisplayName("Awad", "x@y.com", true), "Awad");
});
