import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateRecord,
  totals,
  safeLink,
  type RecordItem,
} from "../lib/renoxis/records.ts";
test("reject unsafe URLs and invalid event order", () => {
  assert.equal(safeLink("javascript:alert(1)"), false);
  assert.equal(safeLink("https://user:pass@example.com"), false);
  assert.throws(() =>
    validateRecord("event", {
      title: "Showing",
      start: "2026-09-20T14:00:00Z",
      end: "2026-09-20T13:00:00Z",
    }),
  );
});
test("strip unknown fields and protect numeric totals", () => {
  assert.deepEqual(
    validateRecord("task", {
      title: "  Follow up ",
      done: false,
      user_id: "someone-else",
    }),
    { kind: "task", data: { title: "Follow up", done: false } },
  );
  assert.throws(() =>
    validateRecord("transaction", { title: "Deal", commission: -2 }),
  );
  assert.throws(() =>
    validateRecord("transaction", { title: "Deal", commission: "100" }),
  );
});
test("empty dashboard and commissions are derived, cancelled excluded", () => {
  assert.deepEqual(totals([]), { forecast: 0, closed: 0, tasks: 0 });
  const records: Pick<RecordItem, "kind" | "data">[] = [
    {
      kind: "transaction",
      data: { title: "a", commission: 2500, status: "Closed" },
    },
    {
      kind: "transaction",
      data: { title: "b", commission: 9000, status: "Cancelled" },
    },
    { kind: "task", data: { title: "c", done: false } },
  ];
  assert.deepEqual(totals(records), { forecast: 2500, closed: 1, tasks: 1 });
});
