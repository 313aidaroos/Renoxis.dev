import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emailLinkError, emailLinkOptions, NO_EMAIL_ACCOUNT_MESSAGE } from "../lib/renoxis/email-link.ts";

test("email-link options never create a user (Apixis ID is the only signup)", () => {
  const o = emailLinkOptions("https://renoxis.dev/auth/callback?next=%2Fdashboard");
  assert.equal(o.shouldCreateUser, false);
  assert.equal(o.emailRedirectTo, "https://renoxis.dev/auth/callback?next=%2Fdashboard");
});

test("every signInWithOtp call in the app goes through emailLinkOptions", () => {
  for (const file of ["app/login/page.tsx", "components/LoginForm.tsx"]) {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    const calls = src.match(/signInWithOtp\(\{[^;]*\);/g) ?? [];
    assert.ok(calls.length > 0, `${file} has a signInWithOtp call`);
    for (const c of calls) assert.match(c, /options: emailLinkOptions\(/, `${file}: ${c}`);
  }
});

test("login copy no longer says the email link starts an account", () => {
  for (const file of ["app/login/page.tsx", "components/WelcomeExperience.tsx", "components/CixyHelp.tsx"]) {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(src, /starts your account/i, file);
  }
  assert.match(readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8"), /Already have a Renoxis email account\? Sign in with your email link/);
});

test("unknown-email error points new people to Apixis ID", () => {
  assert.equal(emailLinkError("Signups not allowed for otp"), NO_EMAIL_ACCOUNT_MESSAGE);
  assert.match(NO_EMAIL_ACCOUNT_MESSAGE, /Apixis ID/);
  assert.equal(emailLinkError("Email rate limit exceeded"), null);
});
