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

