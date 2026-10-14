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
- Changed: `docs/LAUNCH_CHECKLIST_2027-01-01.md` (done / to do without Awad / needs Awad). Phone header keeps Sign in, Open dashboard, Companies, and Feed. `/support` no longer claims a cancel button. Document upload and delete require a server seat. Listing copy does not reserve 1,000 Ixis. Listing errors use an alert. `package.json` asks for Node 22.
- Why: Launch audit for 2027-01-01. These items do not need a secret, a live charge, a merge, or a production database change.
