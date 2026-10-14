import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("phone header keeps sign-in and the companies and feed links", async () => {
  const css = await readFile(
    new URL("../components/welcome.css", import.meta.url),
    "utf8",
  );
  assert.match(
    css,
    /@media\(max-width:700px\)\{[\s\S]*?nav>a:not\(\.primary\):not\(\.auth-home-link\):not\(\.nav-keep\)\{display:none\}/,
  );
  assert.doesNotMatch(css, /nav>a\{display:none\}/);
  const home = await readFile(
    new URL("../components/WelcomeExperience.tsx", import.meta.url),
    "utf8",
  );
  assert.match(home, /className="nav-keep" href="\/companies"/);
  assert.match(home, /className="nav-keep" href="\/feed"/);
  assert.match(home, /className="primary"/);
});

test("support does not claim a cancel button that is not in the app", async () => {
  const source = await readFile(
    new URL("../app/support/page.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /workspace settings/);
  assert.match(source, /no cancel button in settings/);
  assert.match(source, /mailto:renoxis@apixis.dev/);
});

test("listing generator announces failures", async () => {
  const source = await readFile(
    new URL("../components/ListingForm.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /role="alert"/);
  assert.doesNotMatch(source, /Error: \$\{/);
});
