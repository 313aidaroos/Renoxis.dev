import assert from "node:assert/strict";
import { test } from "node:test";
import {
  APIXIS_WALLET_HOME,
  FALLBACK_WALLET_HREF,
  RENOXIS_APP_ORIGIN,
  allowlistedReturnUrl,
  studioReturnUrl,
  walletEntryUrl,
} from "../lib/renoxis/wallet.ts";

function returnTarget(href: string) {
  const url = new URL(href);
  const back = url.searchParams.get("return_url");
  assert.ok(back);
  return { url, back: new URL(back) };
}

test("buy link is /buy with product=renoxis and a studio return", () => {
  const href = walletEntryUrl();
  const { url, back } = returnTarget(href);
  assert.equal(url.origin, APIXIS_WALLET_HOME);
  assert.equal(url.pathname, "/buy");
  assert.equal(url.searchParams.get("product"), "renoxis");
  assert.equal(url.searchParams.get("origin"), null);
  assert.equal(back.origin, RENOXIS_APP_ORIGIN);
  assert.equal(back.hostname, "renoxis.vercel.app");
  assert.equal(back.protocol, "https:");
  assert.equal(back.searchParams.get("board"), "Cixy Studio");
  assert.equal(FALLBACK_WALLET_HREF, href);
  assert.equal(studioReturnUrl(), back.toString());
});

test("only https://renoxis.vercel.app is an allowlisted return", () => {
  const studio = allowlistedReturnUrl("https://renoxis.vercel.app/dashboard");
  const parsed = new URL(studio);
  assert.equal(parsed.hostname, "renoxis.vercel.app");
  assert.equal(parsed.pathname, "/dashboard");
  assert.equal(parsed.protocol, "https:");

  const withBoard = walletEntryUrl("https://renoxis.vercel.app/dashboard");
  const { back } = returnTarget(withBoard);
  assert.equal(back.pathname, "/dashboard");
  assert.equal(back.searchParams.get("board"), "Cixy Studio");
});

test("preview, localhost, and other hosts fall back to Cixy Studio", () => {
  for (const bad of [
    "https://renoxis-preview.vercel.app/dashboard",
    "https://renoxis-git-main.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000/",
    "https://evil.example",
    "http://evil.example",
    "javascript:alert(1)",
    "https://user:pass@renoxis.vercel.app",
    "https://renoxis.vercel.app:444/buy",
    "not a url",
    "",
  ]) {
    const { url, back } = returnTarget(walletEntryUrl(bad));
    assert.equal(url.pathname, "/buy");
    assert.equal(url.searchParams.get("product"), "renoxis");
    assert.equal(back.hostname, "renoxis.vercel.app");
    assert.equal(back.protocol, "https:");
    assert.equal(back.port, "");
    assert.equal(back.searchParams.get("board"), "Cixy Studio");
  }
});
