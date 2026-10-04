import { test } from "node:test";
import assert from "node:assert/strict";
import { isOwner, isOwnerEmail } from "../lib/renoxis/owners.ts";

test("owner allowlist needs a confirmed owner email", () => {
  assert.equal(isOwnerEmail(" AWAD@apixis.dev "), true);
  assert.equal(isOwner({ email: "alaidaroosawad@gmail.com", email_confirmed_at: "2026-10-04T00:00:00Z" }), true);
  assert.equal(isOwner({ email: "alaidaroosawad@gmail.com", email_confirmed_at: null }), false);
  assert.equal(isOwner({ email: "x@example.com", email_confirmed_at: "2026-10-04T00:00:00Z" }), false);
  assert.equal(isOwner(null), false);
});
