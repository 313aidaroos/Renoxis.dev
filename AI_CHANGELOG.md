# AI Change Log

## Rules for AI models, bots, and agents

If you are an AI (Claude, ChatGPT, Grok, Gemini, Copilot, Cursor, JunoAI, or any other model, bot, or agent) and you add, modify, or delete anything in this repository, you **must** append a dated entry to this file describing what you changed and why — one entry per work session, no exceptions. This log is how the repository owner tracks what every AI did. Human commits do not need entries.

Entry format:

## YYYY-MM-DD — <your name/model>
- Changed: <files or area>
- Why: <reason>

---

## 2026-09-28 — JunoAI
- Changed: created this file
- Why: owner's standing rule — every AI that touches this repo must log its changes here

## 2026-09-30 — Claude (branch claude/awesome-newton-3tygzi)
- Changed: `lib/apixis-login.ts` re-copied from `ApixisWallet/sdk/apixis-login-next.ts` — `verifyOtp({ type: "email" })` (D16: new addresses get a `signup` token that `magiclink` rejects). `lib/apixis-wallet.ts` → SDK v3.1 (adds `marketplaceOrder`/`marketplaceSettle`). `lib/apixis-world*.ts` re-synced with Apixis.dev (15 clients incl. ominix, wattixis; 1,000 starter Ixis, D11).
- Changed: `tests/world-agent.test.ts` expects 15 clients.
- Why: family backend pass per Awad's 2026-09-30 decisions (ApixisWallet/AGENTS.md §0c D11–D16; live board: ApixisWallet/docs/FAMILY_STATUS.md). One SDK, one login kit, one world kit — copied from canonical, never patched by hand.

## 2026-10-01 (early) — Claude
- Changed: `.github/workflows/ci.yml` — this repo had no CI on `main` (the shared-CI PR was never merged); it now calls `313aidaroos/github-actions/node-ci` on push/PR. `typecheck` script added where missing so CI type-checks (verified 0 errors, build green).
- Why: overnight second pass — every repo must prove itself on every push.

## 2026-10-04 — Grok
- Changed: added `/feed` (family feed tab), `feed-client/`, `/api/feed-session`, Feed links in the welcome header and Command Desk sidebar, feed-client tests.
- Why: Awad wants the shared family feed tab live on every Ixis site, in each site's own look.

## 2026-10-04 — Claude (Claude Code, full-portfolio review)
- Changed: `NOTES/CLAUDE.md` — this repo's slice of the 24-repo review (what is live, what is open, who owns each item, drift found). No code, env, database or deploy changes.
- Why: Awad asked for every repo to be read twice with a done / to-do / owner status, and for the notes in each repo to be updated. Notes only; Awad approved the merge on 2026-10-04.

## 2026-10-04 — Grok (Renoxis lead, lock audit)
- Changed: 200 → 1,000 starter Ixis copy (`app/login/page.tsx`, `components/ApixisWorldWelcome.tsx`, comments, docs, test mock); the Cixy system prompt is now secular (removed the Muslim-culture identity, insha'Allah/alhamdulillah and the HALAL-CONSCIOUS block), with sign-in described as Apixis ID first and shared-Wallet wording (`lib/renoxis/cixy-prompts.ts`, `docs/CIXY_BRAIN.md`, `tests/cixy-prompts.test.ts`); `NOTES/GROK.md` header repaired, summary corrected, and catch-up entries added for Juno #30/#31, Claude #33/#34/#41, Codex #35–#37 (which had no entry here) and the 10-02 production freeze.
- Why: Awad's locks (1,000 Ixis grant on Apixis.dev; no religious content outside Halaxis; one Apixis ID; shared Wallet) and his rule that every change is logged.

## 2026-10-04 — Grok (Renoxis lead, Awad decisions via hub)
- Changed: the Cixy prompt now says "draws on Arab culture" (nothing religious; tests ban Muslim, insha'Allah, alhamdulillah, halal). Apixis ID is the only signup: the email link uses `shouldCreateUser: false` through `lib/renoxis/email-link.ts`, the /login, home dialog and Cixy help copy is updated, and a test was added. NOTES corrects the #42 attribution and logs the Vercel env changes (`APIXIS_WORLD_KEY` → sensitive, `ANTHROPIC_MODEL` → claude-sonnet-5) and the production redeploy.
- Why: Awad's decisions after the 2026-10-04 lock audit.

## 2026-10-06 — Grok
- Changed: a working Brokerage tab (create or rename a brokerage, add and remove people, roster with status and Cixy spend, office Wallet balance with the existing Apixis Wallet link, recent jobs, and an agent view that says the office pays). Cixy jobs inside a brokerage bill the owner's Apixis Wallet. Property lookup is 25 Ixis. Displayed plan prices are a $50 start fee (5,000 Ixis) and a $100 monthly plan (10,000 Ixis). Migration `supabase/migrations/20261006120000_brokerage_office_wallet.sql` is in the repo and was not applied to production.
- Why: Awad asked for a brokerage an office can use today, with jobs billed to the office, and for the new price lock.

## 2026-10-06 — Claude (family lead): AI Receptionist notes (D18)
- Changed: AI Receptionist section in the family notes (see `docs/AI_RECEPTIONIST.md` in ApixisWallet); notes only, no code.
- Why: Awad approved an AI Receptionist add-on at $100/month for every customer-facing family site and asked every bot and agent to follow one plan.

## 2026-10-13 — Grok
- Changed: locked prices now live in `lib/renoxis/pricing.ts`. Start fee stays $50 (5,000 Ixis, `renoxis.activate`). Monthly is $50 (5,000 Ixis, `renoxis.agent.monthly`) until one calendar month after `LAUNCH_DATE`, then $100 (10,000 Ixis) on a SKU id Awad still has to set. Pages, tour, terms, and seat redeem read that module. The customer picks Ixis or card; Ixis uses the existing Wallet redeem, including Buy Ixis when the balance is short. Card subscription billing shows Coming soon. No Stripe. The Cixy system prompt was not edited. Migration `supabase/migrations/20261006120000_brokerage_office_wallet.sql` is still not applied.
- Why: Awad locked the launch promo on 2026-10-13 and asked for one config so the price switches by itself. Production merge and deploy stay with Awad.

## 2026-10-13 — Grok
- Changed: `LAUNCH_DATE` is now `2027-01-01T06:00:00.000Z` (midnight Central on 2027-01-01). The launch-date TODO is gone. `getMonthlyPrice` switches to $100/month (10,000 Ixis, SKU `renoxis.agent.monthly.10000`) at `2027-02-01T06:00:00.000Z`. Wallet Lead is publishing that SKU id, so the id stays.
- Why: Awad set the official launch date. Production merge stays with Awad.

## 2026-10-13 — Grok
- Changed: Instagram icon link in the existing site footers (home, tour, pricing, feed, login, legal, and the desk). It opens https://www.instagram.com/renoxis.dev/ in a new tab. No Facebook link. No new icon package and no .svg file.
- Why: The footer should point at the Renoxis brand accounts. Instagram oEmbed confirms “Renoxis RE Company (@renoxis.dev)”. facebook.com/renoxis.dev could not be confirmed as a real page, so that link was left out.

## 2026-10-14 — Grok
- Changed: `lib/renoxis/cixy-prompts.ts` now reads seat and job prices from `lib/renoxis/pricing.ts`. Cixy quotes a $50 start fee and $50/month for the first month after the 2027-01-01 public launch, then $100/month from 2027-02-01, with card billing as coming soon. The prompt also covers the PHA-only EHV Oct 15 estimate-correction window (PIH 2026-25), the Delaware and Rhode Island wholesale dates, that NC HB 797 is not law, and that HUD's Wells Fargo matter is an investigation only. The prompt stays secular. `tests/cixy-prompts.test.ts` covers those lines.
- Why: Awad asked Cixy to use the locked prices and the 10-08 / EHV / wholesale briefs. No redesign. Production merge stays with Awad.

## 2026-10-14 — Grok 4.7
- Changed: `docs/LAUNCH_CHECKLIST_2027-01-01.md` (done / to do without Awad / needs Awad). Phone header keeps Sign in, Open dashboard, Companies, and Feed. `/support` no longer claims a cancel button, and the page no longer has unescaped apostrophes. Document upload and delete require a server seat. Listing copy does not redeem and does not name a 1,000 Ixis charge. Listing errors use an alert. `package.json` asks for Node 22.
- Why: Launch audit for 2027-01-01. These items do not need a secret, a live charge, a merge, or a production database change. Merged as https://github.com/313aidaroos/Renoxis.dev/pull/52. The footer rebase is https://github.com/313aidaroos/Renoxis.dev/pull/53. Rebased onto `main` after #51 (`7f28d23`). The Cixy changelog entry above stays. #32 is closed.

## 2026-10-14 — Grok 4.7
- Changed: rebased the “Other Ixis companies” footer from #32 onto current `main`. One list (`lib/renoxis/ixis-companies.ts`), one row (`components/OtherIxisCompanies.tsx`) on the home, tour, pricing, login, support, and feed footers. The same 11 https links. Pinixis, Launchixis, Ominix, Qahwah World, and Nursery Toons stay off this row.
- Why: #32 is closed. This brings that row onto current `main`, which already has the Cixy brief and the merged launch-checklist work from #52. Support and feed did not exist when #32 opened, so the row is on those footers too.

## 2026-10-17 — Grok 4.7
- Changed: `lib/renoxis/cixy-prompts.ts` and `tests/cixy-prompts.test.ts`. The PHA-only EHV estimate-correction window is now past tense (closed 2026-10-15 11:59:59 PM ET). Nov 1 and Dec 31 are unchanged, with December 2026 HAP only. Iowa Code §543B.6A wholesaling facts from the 2026-10-16 brief are in the same prompt. Cixy stays secular, one shared brain. `reports/2026-10-17-renoxis.md` is a read-only launch status. `NOTES/GROK.md` records the prompt change.
- Why: The 2026-10-16 Cixy brief says that correction window closed on 2026-10-15, and Iowa §543B.6A was verified. No env, Stripe, migration, email, or merge.

## 2026-10-17 — Grok
- Changed: new Renoxis logo (Awad's option #1: royal-blue R with a white house and a red leg, Montserrat ExtraBold wordmark) and a matching site theme. The logo PNGs ship from `lib/brand/assets.ts` and are served at `/brand/<name>.png` (`app/brand/[asset]/route.ts`) and `/favicon.ico` (`app/favicon.ico/route.ts`). Header, desk sidebar, legal bar, sign-in, pricing, support, feed and companies headers use the mark. Favicon, apple-touch icon and manifest icons (192, 512, maskable 512) point at the new PNGs. `public/app-icon.svg`, `public/icon-180.png`, `public/icon-192.png`, `public/icon-512.png` and `app/favicon.ico` are removed. Palette: blue #1854d0 (dark #0f3a8f, navy rail #0b1f4d), red #e23c40 (text-safe #b8262b), background #f5f7fb, text #14203a, muted #56607a, line #dde3ee; focus ring is the logo red. Headings use Montserrat (600–800) and body text Inter, via `next/font`. The default “red” desk theme is now the brand blue rail with a red accent, and Cixy's red coat is the logo red #e23c40. The old #b91c1c coat still reads as red. The home Cixy also wears the red coat. The Emerald theme keeps the original greens.
- Why: Awad picked the new logo and asked for the site to match it. Layout and behavior are unchanged. No migration, no env change, no merge.

## 2026-10-19 — Grok 4.7
- Changed: card checkout for the seat start fee and the monthly plan. Buy Ixis copy in `docs/CIXY_CONNECTIONS.md`, `docs/CIXY_CUSTOMIZATION.md`, and `app/privacy/page.tsx` uses https://wallet.apixis.dev. `components/SeatPay.tsx` and `components/PricingCheckout.tsx` replace “Coming soon” with a Stripe Checkout button. The Ixis redeem buttons are unchanged. If `STRIPE_SECRET_KEY` or a price id is missing, that button stays disabled. `app/api/stripe/checkout` creates a Checkout Session. `app/api/stripe/webhook` verifies `STRIPE_WEBHOOK_SECRET` and handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`. It grants or revokes `renoxis_entitlements` (`activated_at`, `seat_period_end`, `source`, `last_receipt_id`) and is idempotent on the Stripe event id. Amounts come from `lib/renoxis/pricing.ts` (`LAUNCH_DATE`, `PROMO_END`). Price ids come from `STRIPE_PRICE_START_FEE`, `STRIPE_PRICE_MONTHLY_PROMO`, and `STRIPE_PRICE_MONTHLY_STANDARD`. A promo subscription is scheduled to the standard price at `PROMO_END`. Migration `supabase/migrations/20261019120000_stripe_seat_card.sql` is in the repo and was not applied. Buy Ixis links point at https://wallet.apixis.dev. No Ixis are granted here. Sign-in for card checkout is Apixis ID.
- Why: Renoxis must take card payments for seats and plans on the shared Apixis.dev Stripe account, beside the existing Ixis path. No Stripe objects were created, no env was set, and the migration was not run.

## 2026-10-19 — Grok 4.7
- Changed: theme tokens so the default desk uses brand blue `#1854D0` as the primary identity and brand red `#D83030` as the accent and CTA. Source is `public/brand/brand.json` (not a guessed pixel sample). Body text is brand text `#0F1B33`. Small red text and button hover stay `#b8262b` so contrast stays WCAG AA on `#F5F7FB`. `.primary` buttons, the welcome sign-in button, seat-pay primary, focus rings, kicker dots, and the red desk-theme accent use `#D83030`. Cixy’s default coat is `#d83030`; saved coats `#e23c40` and `#b91c1c` still map to the red theme. The painted sprite green `#075d4b` is unchanged. Optional Emerald, Sunset, and Night themes stay. Login no longer uses emerald button utilities. The “A Apixis Company” badge is unchanged. No SVG added, no logo redraw, no env, Stripe, or migration edit.
- Why: Awad wants the site red and blue to match the Renoxis logo, replacing the old emerald accent rule, using the colors in `brand.json`.
