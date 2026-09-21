import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  APIXIS_WALLET_HOME,
  FALLBACK_WALLET_HREF,
  RENOXIS_APP_ORIGIN,
  allowlistedReturnUrl,
  walletEntryUrl,
} from "../lib/renoxis/wallet.ts";

const previous = process.env.APP_URL;

afterEach(() => {
  if (previous === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = previous;
});

test("wallet entry uses the home URL with origin and a canonical return", () => {
  delete process.env.APP_URL;
  const href = walletEntryUrl();
  const url = new URL(href);
  assert.equal(url.origin, APIXIS_WALLET_HOME);
  assert.equal(url.pathname, "/");
  assert.equal(url.searchParams.get("origin"), "renoxis");
  assert.equal(url.searchParams.get("return_url"), RENOXIS_APP_ORIGIN);
  assert.equal(FALLBACK_WALLET_HREF, href);
});

test("APP_URL origin is allowlisted when it is https or loopback", () => {
  process.env.APP_URL = "https://renoxis-preview.vercel.app/dashboard";
  assert.equal(
    allowlistedReturnUrl(process.env.APP_URL),
    "https://renoxis-preview.vercel.app",
  );
  assert.equal(
    new URL(walletEntryUrl(process.env.APP_URL)).searchParams.get("return_url"),
    "https://renoxis-preview.vercel.app",
  );

  process.env.APP_URL = "http://localhost:3000";
  assert.equal(allowlistedReturnUrl(), "http://localhost:3000");

  process.env.APP_URL = "http://127.0.0.1:3000/";
  assert.equal(allowlistedReturnUrl(), "http://127.0.0.1:3000");
});

test("untrusted return targets fall back to renoxis.vercel.app", () => {
  process.env.APP_URL = "https://renoxis.vercel.app";
  for (const bad of [
    "https://evil.example",
    "http://evil.example",
    "javascript:alert(1)",
    "https://user:pass@renoxis.vercel.app",
    "not a url",
    "",
  ]) {
    assert.equal(allowlistedReturnUrl(bad), RENOXIS_APP_ORIGIN);
  }

  process.env.APP_URL = "http://evil.example";
  assert.equal(allowlistedReturnUrl(), RENOXIS_APP_ORIGIN);
});
