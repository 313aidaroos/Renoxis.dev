import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { OTHER_IXIS_COMPANIES } from "../lib/renoxis/ixis-companies.ts";

test("footer lists the other Ixis companies with https URLs, no duplicates", () => {
  assert.equal(OTHER_IXIS_COMPANIES.length, 15);
  const urls = OTHER_IXIS_COMPANIES.map((company) => company.url);
  assert.equal(new Set(urls).size, urls.length);
  for (const company of OTHER_IXIS_COMPANIES) {
    assert.ok(company.name.trim().length > 0);
    assert.equal(new URL(company.url).protocol, "https:");
  }
});

test("footer leaves out Renoxis and the excluded projects", () => {
  const text = JSON.stringify(OTHER_IXIS_COMPANIES).toLowerCase();
  for (const bad of [
    "renoxis",
    "nexxis",
    "omnixis",
    "personalcontentbot",
    "awadbot",
    "qahwah",
    "nursery",
  ]) {
    assert.equal(text.includes(bad), false, bad);
  }
});

test("public welcome footers render the other-companies row", async () => {
  const files = [
    "../components/WelcomeExperience.tsx",
    "../components/AuthShell.tsx",
    "../app/pricing/page.tsx",
    "../app/support/page.tsx",
    "../app/feed/page.tsx",
  ];
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /<OtherIxisCompanies \/>/);
  }
});
