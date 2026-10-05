# NOTES/GROK.md

## 2026-10-04 summary

- **Grok:** shipped the Socixis Social Feed tab and verified-owner seat/payment bypass.
- **Lead:** made the shared-feed sync, empty-state, and share-link fixes on the feed branch.
- **Claude:** merged PR #41 (`8a8360e`) around 6:31 PM CT for the full-portfolio notes review; the later Renoxis lock-fix PR #42 (`0b1ff67`) corrected 1,000-Ixis copy and secular Cixy wording, with undo entries below.
- **Hermes:** no 2026-10-04 commit or merged PR identified in this repository.
- **Juno:** no 2026-10-04 commit or merged PR identified in this repository.

## Catch-up correction — 2026-10-04 (CT)

Claude activity was present; the earlier “no Claude activity” line was incorrect. Each item below has an undo pointer.

- **Grok (Renoxis lead) audit, 2026-10-04 6:54 PM CT — PR #42, merge `0b1ff6702d744d48e0b53154b8a44626ff38d306`:** corrected Renoxis 1,000-Ixis signup copy, secularized Cixy outside Halaxis, clarified the shared Wallet/Apixis ID lock, and repaired the notes summary/header; no env, DB, Stripe or Wallet change. Undo: `git revert 0b1ff6702d744d48e0b53154b8a44626ff38d306` (or close the preview PR if treated as not approved).
- **Claude, 2026-10-04 6:31 PM CT — PR #41, merge `8a8360e774c7a34712fd116e131d5985b6f86c92`:** notes: Claude full-portfolio review 2026-10-04 (NOTES/CLAUDE.md, AI_CHANGELOG); added `NOTES/CLAUDE.md` and `AI_CHANGELOG.md` (notes/docs only). Undo: `git revert 8a8360e774c7a34712fd116e131d5985b6f86c92`.

Grok Bot notes. Every change Grok Bot makes to this product gets a dated entry here so Claude, Hermes and Codex stay on the same page.

## 2026-09-27 (CT) — Apixis Wallet balance pill (PR #26, merge 58dee45)
- What: header pill on every Command Desk board shows the signed-in person's Apixis Wallet Ixis balance (links to Buy Ixis); a small "Sign in with Apixis" link shows when the account has no Apixis ID link. Balance refetches on focus / visibilitychange / pageshow, so it updates on return from Apixis Wallet.
- Where: `components/WalletPill.tsx` (new), `lib/renoxis/use-wallet-balance.ts` (`useWalletState`), `app/api/wallet/balance/route.ts` (adds `linked`), `components/CommandDesk.tsx` (pill in `.top-actions`), `components/command-desk.css` (pill styles).
- Not touched: Wallet code/env/keys, Stripe, checkout, payment links.
- Undo: `git revert -m 1 58dee4588c65c0030b41fa67a9c397b53fa351a6` (or revert PR #26 in GitHub).

## 2026-09-28 (CT) — Grok Developer Bot: automatic Apixis world agent for new accounts
- What: a NEW Renoxis account (created on/after 2026-09-28 00:00 CT, email confirmed or signed in with Apixis ID) gets its own Apixis world agent on its first Command Desk load: the server calls Apixis.dev `POST /api/agent/provision` (Apixis.dev PR #51), which creates or reuses the citizen, one agent (default Apixis body, customizable hair/outfit/colors) and the one-time 200 in-world Ixis. Renoxis stores `app_metadata.apixis_world_agent_at/_id/_name` on the Supabase auth user so later loads skip the call. The desk then shows "Your agent is ready. Enter the Apixis world" with Cixy as guide; the button goes to `https://www.apixis.dev/enter?from=renoxis` (Apixis ID → world → "Back to Renoxis"). Enter / "Not now" sets `app_metadata.apixis_world_welcome_at` so the card is hidden on every device. Older accounts keep the one-time per-browser prompt; the sidebar "Apixis World" link stays for everyone.
- Why this design (server-side provision, not a forced redirect): the agent exists even if the person never follows a redirect, the paywall/activation/tour flow is not interrupted, and password/magic-link signups are not sent to a second sign-in right after signing up. Entry into the world still always goes through Apixis ID. Idempotent: Apixis.dev enforces one citizen per email, one agent per citizen, one starter grant per agent in the database.
- Where: `app/dashboard/page.tsx`, `components/CommandDesk.tsx` (card slot replaces the old prompt markup), `components/ApixisWorldWelcome.tsx` + `components/apixis-world-welcome.css` (new), `app/api/apixis/world-welcome/route.ts` (new), `lib/renoxis/world-agent.ts` + `lib/renoxis/world-agent-server.ts` (new), `lib/apixis-world-provision.ts` (new, copy of Apixis.dev `sdk/apixis-world-provision.ts`), `lib/apixis-world.ts` (13 clients), `lib/renoxis/apixis-entry.ts` (comment), `tests/world-agent.test.ts`, `.env.example`.
- Env (Vercel `renoxis`, production + preview): `APIXIS_WORLD_KEY` (server only; Apixis.dev holds only its SHA-256 in `APIXIS_WORLD_KEYS`).
- Not touched: login/auth pages (login sweep), WalletPill, Stripe/checkout/payments, Supabase schema.
- Undo: revert this PR's merge commit; optionally delete `APIXIS_WORLD_KEY` (without it the provision call is skipped and the card falls back to the invite, which still creates the agent on entry). Agents already created stay on Apixis.dev (no data is deleted).

## 2026-09-28 (CT) — Grok Developer Bot: login sweep (PR #27, squash 969cd33)
- Before: /login had no site header, a "Sign in with Apixis" button and no way to reset a forgotten password.
- What: /login uses the home header/footer (`components/AuthShell.tsx`, `components/auth.css` on top of welcome.css tokens). Heading + primary button "Log in with Apixis ID" (→ /auth/apixis/start). Email link + Password tabs kept (Renoxis Supabase accounts). "Forgot password?" → `resetPasswordForEmail` → /auth/callback → /set-password?reset=1 ("Choose a new password", no Skip, expired link → new link). `/auth/callback` skips the first-password detour for reset links. `/auth/error` restyled with a way back. Copy: 200 Ixis (in-world, Apixis agent).
- Cixy: `components/CixyHelp.tsx` card (official Combo A avatar `public/cixy/cixy-combo-a-avatar.webp`, answers for Apixis ID / forgot password / email link, "Ask Cixy ↗" → https://apixis.dev/login#ask-cixy). Renoxis's own CixyChat needs a signed-in session, so Renoxis still needs a public Cixy chat hooked up.
- Home sign-in dialog (WelcomeExperience): "Log in with Apixis ID" button, password link, compact Cixy help.
- WalletPill: "Link Apixis ID" instead of "Sign in with Apixis" for signed-in, unlinked accounts.
- Verified live 2026-09-28 ~02:00 CT: reset email from renoxis@apixis.dev, redirect to renoxis.dev/auth/callback allowed in Supabase loyjbfqpanskcecvpolt, new password saved → /dashboard, password login works (desktop + mobile). Test user grok-apixis-1790575604@uberip.com (Renoxis auth user) created for this; not deleted (Awad to decide).
- Deploy: dpl_4QuAsXHaQxkkk5rD8zJMEvDFUDUA READY. No payments/Stripe/env/DB changes.
- Undo: `git revert 969cd3314db38d327a1c1dd0f049864cd02c2ec2`.

- 2026-09-28 (CT) follow-up: PR #28 squash `a77319d`, PR #29 squash `9f3c91e` (guide label polish). Production deploy READY. Live test: grok-agent-renoxis-1790579024@uberip.com (magic-link signup → agent created on first desk load → Enter → Apixis ID signup on the Wallet → world with "Back to Renoxis" → back; 1 agent, 1 starter grant of 200) and grok-agent-renoxis-1790579475@uberip.com ("Not now" hides the card). Both are throwaway test accounts (Renoxis auth user; account 1 also has a Wallet auth user) and safe to delete. Screenshots: /workspace/audit/agent-onboarding/renoxis/ on the Grok box. Undo #28: `git revert a77319d` (and #29: `git revert 9f3c91e`).

## 2026-10-04 (CT) — Grok: Feed tab on Renoxis
- What: new public `/feed` page (Socixis Social family feed: one mixed For You feed from every Apixis company, source-site badges, AI labels, Following, Search · Trending, video/photo/text posts, follow, like, threaded comments, save, share, report, tips 10/50/100 Ixis, boost 250 Ixis/day). Signed-out visitors can browse; acting needs Apixis ID sign-in. "Feed" link added to the welcome header and the Command Desk sidebar.
- Where: `feed-client/` (shared copyable client), `app/feed/` (page in the welcome-shell header/footer, Renoxis skin, `feed.css` mapped onto Renoxis colors/fonts), `app/api/feed-session/route.ts` (mints the browser feed token server-side with `APIXIS_WORLD_KEY`), one link each in `components/WelcomeExperience.tsx` and `components/CommandDesk.tsx`, `tests/feed-client.test.ts`, and a lint override in `eslint.config.mjs` scoped to `feed-client/**` only (react-hooks refs/set-state-in-effect/purity, no-img-element; the shared client uses these patterns on purpose).
- For You is the unfiltered mix of all companies (including the agents' daily reports); no source_site filter by default.
- Who: Grok (for Awad). No DB/env/Wallet changes. No SVGs.
- Undo: `git revert <merge sha>` of this PR.

## 2026-10-04 (CT) — Grok Bot: Feed visual fixes on Renoxis.dev (preview only, NOT merged)
- Why: same lessons as the Socixis fix (Socixis PR #63). Awad put feed changes on hold, so this PR is for preview review only; do not merge until Awad says so.
- What: (1) Text-only posts use this site's normal body font (not the display/serif headline font), wrap long words and hashtags, and size to their content; no forced 450–520px empty card. Video/photo posts keep the full-height layout. (2) Feed modals and toasts sit above everything (z-index 2147483000, own stacking context); any element marked `data-floating-widget` hides while a feed modal is open. (3) Signed out, the 4th tab says "You" and shows the sign-in card; there is no "Sign in" tab button.
- Where: `app/feed/feed.css` (shared layout part + removed the Georgia text-post override), `feed-client/` synced from the canonical client. Theme (header, fonts, colors, buttons, footer) unchanged. No SVGs, no DB/env/API change.
- Who: Grok Bot (for Awad).
- Undo: close this PR, or `git revert <squash sha>` if it is ever merged.

## 2026-10-04 19:00 (CT) — Grok Bot: Feed phone tab fit (same PR, still NOT merged)
- What: at 375px the 4th "You" tab was pushed off-screen by "Search · Trending". Under 560px the tab now reads "Search", tabs are tighter, and if a wide site font still can't fit the tabs and "+ Post" on one row, Post drops to its own row instead of covering "You". Desktop is unchanged; the site's colors, fonts and buttons are untouched; no SVGs.
- Where: feed client `FeedView.tsx` (tab label) and the shared layout section of the site's feed CSS.
- Who: Grok Bot (for Awad). No merge, no production deploy.
- Undo: revert this commit on the PR branch.
## 2026-10-04 — Owner allowlist (Grok)
- What: lib/renoxis/owners.ts adds isOwner(user), which needs a confirmed email that is alaidaroosawad@gmail.com, awad@apixis.dev or in ADMIN_EMAILS (Vercel env). An owner gets seat access with no seat row: serverEntitlement returns source admin_beta / activatedAt "owner-bypass", so records, chat, listings/generate and cixy/draft open. Paid office actions (email_draft 50, offer_letter 100 Ixis) skip the Wallet for an owner. These are product gates only: no entitlement row, no Wallet call, no ledger entry. His real Wallet seat redemptions still work as normal. Both owner accounts in Supabase loyjbfqpanskcecvpolt were confirmed by a real email step.
- Not changed: brokerage roles (owner/broker/agent/assistant) are per-office membership enforced in RLS. There is no platform admin page, and no new admin UI was built. He is owner of any office he creates.
- Where: lib/renoxis/owners.ts, lib/renoxis/entitlements.ts, lib/renoxis/wallet-charge.ts, tests/owners.test.ts. ADMIN_EMAILS was added to the Vercel project renoxis (production + preview).
- Who: Grok.
- Undo: revert this PR and remove ADMIN_EMAILS from Vercel.
## 2026-10-04 catch-up provenance (CT)

The entries below record the day's observed commits and merged PRs. Existing detailed entries above remain the change descriptions; this section supplies exact provenance and undo pointers.

### Commits
- `178c662` (2026-10-04T17:39:56-05:00, 313aidaroos; 313aidaroos@users.noreply.github.com) — Feed tab: share links keep the page hash; sync shared feed-client. Undo: no main change; close/delete the branch (or revert the branch commit before reuse).
- `2c96eb4` (2026-10-04T17:29:29-05:00, 313aidaroos; 313aidaroos@users.noreply.github.com) — Feed tab: sync latest shared feed-client, scope lint override to feed-client. Undo: no main change; close/delete the branch (or revert the branch commit before reuse).
- `592d655` (2026-10-04T17:33:56-05:00, 313aidaroos; 313aidaroos@users.noreply.github.com) — Feed tab: no empty gap under an empty feed. Undo: no main change; close/delete the branch (or revert the branch commit before reuse).
- `7b7d1f3` (2026-10-04T17:17:36-05:00, 313aidaroos; 313aidaroos@users.noreply.github.com) — Feed tab: Socixis Social family feed at /feed (shared feed-client + Renoxis skin). Undo: no main change; close/delete the branch (or revert the branch commit before reuse).
- `a044c43` (2026-10-04T17:44:12-05:00, 313aidaroos; alaidaroosawad@gmail.com) — Feed tab: Socixis Social family feed at /feed (#38). Undo: undo via the merged PR below: git revert a044c43.
- `a714939` (2026-10-04T18:14:55-05:00, 313aidaroos; alaidaroosawad@gmail.com) — Owner allowlist: confirmed owner emails skip seat gate and per-use Ixis charges (#40). Undo: undo via the merged PR below: git revert a714939.
- `bbae5b2` (2026-10-04T18:09:08-05:00, 313aidaroos; 313aidaroos@users.noreply.github.com) — Feed: text posts size to content in the body font, modals above everything, 'You' tab when signed out. Undo: no main change; close/delete the branch (or revert the branch commit before reuse).

### Merged PRs
- PR #40, merge `a714939`, `grok/owner-allowlist` → `main`, merged 2026-10-04 CT by 313aidaroos: Owner allowlist: confirmed owner emails skip seat gate and per-use Ixis charges. Undo: `git revert a714939`.
- PR #38, merge `a044c43`, `grok/feed-tab` → `main`, merged 2026-10-04 CT by 313aidaroos: Feed tab: Socixis Social family feed at /feed. Undo: `git revert a044c43`.

## 2026-10-04 (CT) — Grok audit: catch-up entries for work that had no note here
Written by Grok Bot (Renoxis lead) after Claude's full-portfolio pass. These entries record work by other agents that was missing from this file. The dates are CT unless marked otherwise.

### 2026-09-28 — JunoAI: AI change log rule (PR #30, squash 115fdd0) and shared CI (PR #31, closed)
- What: #30 added `AI_CHANGELOG.md` (every AI must log a dated entry) and linked it from `AGENTS.md` / `CLAUDE.md`. #31 (`junoai/ci`, a shared CI caller plus JunoAI notes) was **closed without merging**. Claude's #34 later replaced it.
- Where: `AI_CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`. Branches `junoai/ai-changelog` (merged) and `junoai/ci` (stale, unmerged, 5 commits).
- Who: JunoAI, merged by 313aidaroos.
- Undo: `git revert 115fdd0`. `junoai/ci` can be deleted if nobody wants it.

### 2026-09-30 — Claude: re-synced Apixis kits (PR #33, squash 732c65a)
- What: `lib/apixis-login.ts` was re-copied from the canonical Wallet login kit (`verifyOtp({ type: "email" })`). `lib/apixis-wallet.ts` moved to SDK v3.1 (adds `marketplaceOrder` / `marketplaceSettle`). `lib/apixis-world.ts` and `lib/apixis-world-provision.ts` were re-synced with Apixis.dev (15 clients, comments say 1,000 starter Ixis). `tests/world-agent.test.ts` now expects 15 clients. No UI, theme, SVG, env or DB change.
- Who: Claude (Claude Code session 012qJHsN…), co-author trailer `Claude <noreply@anthropic.com>`, merged by 313aidaroos.
- Undo: `git revert 732c65a`. This brings back the old `magiclink` OTP type, which breaks new-address email sign-in, so revert only together with the Wallet kit.

### 2026-09-30 (Oct 1 early, per AI_CHANGELOG) — Claude: CI on push/PR (PR #34, squash 210e42f)
- What: `.github/workflows/ci.yml` calls `313aidaroos/github-actions/node-ci` on push and PR. `package.json` gained a `typecheck` script.
- Who: Claude (same session), merged by 313aidaroos.
- Undo: `git revert 210e42f`.

### 2026-10-02 — Codex: Apixis Companies page (PRs #35 55d4aea, #36 9293338, #37 488674a)
- What: `/companies` lists the 15 family companies with photo cards and motion. A "Companies" link was added to the welcome header. #37 fixed the Recovra link. **None of these PRs added an `AI_CHANGELOG.md` entry.**
- Lock issue (not fixed here, needs Awad / hub): `app/companies/page.tsx` draws **15 inline SVG icons**, which breaks the no-SVG rule. Ominix still links to `nexxis-tau.vercel.app`, which Claude's review calls a retired host. It still answers 200, and the new host is not known here.
- Who: Codex, merged by 313aidaroos.
- Undo: `git revert 488674a 9293338 55d4aea`.

### 2026-10-02 → 2026-10-04 — production freeze at 488674a
- What: from #37 (2026-10-02 01:18 PT, 03:18 CT) until #38 deployed (2026-10-04 17:44 CT), production `renoxis.dev` stayed on `488674a`, and nothing merged to main. After the freeze, #38, #40, 2eac753 and #41 each deployed to production. Production is now `8a8360e` (`dpl_2MwXMwqNxs2rcGqTTzasMfcfgMwR`, READY).
- Undo: to return to the freeze point, promote the old `488674a` production deployment in Vercel (Instant Rollback). Do not force-push main.

### 2026-10-04 — Claude: full-portfolio review notes (PR #41, squash 8a8360e)
- What: added `NOTES/CLAUDE.md` (this repo's status: live / open / owner / drift) and an `AI_CHANGELOG.md` line. Notes only, with no code, env, DB, theme or SVG change. Its open items are the 200→1,000 copy, the Ominix host, `ANTHROPIC_MODEL` default drift, and missing AI_CHANGELOG entries for #37/#38. The 200→1,000 copy is fixed in the PR below. The rest stay open.
- Who: Claude (Claude Code session 01AQ6sDz…), merged by 313aidaroos with Awad's approval.
- Undo: `git revert 8a8360e`.

## 2026-10-04 (CT) — Grok: lock fixes, 1,000 Ixis copy + secular Cixy prompt (branch `grok/renoxis-claude-audit-20261004`, preview only)
- Before (live on renoxis.dev, checked 2026-10-04 ~19:00 CT): /login said "**200 Ixis** to start", and the signed-in "Your agent is ready" card said "200 in-world Ixis to start". The Cixy system prompt (`lib/renoxis/cixy-prompts.ts`, there since db9004d, 2026-09-22) said Cixy "draws on Arab and Muslim culture", allowed "insha'Allah" / "alhamdulillah", and had a HALAL-CONSCIOUS block (riba / Shariah advisor / gharar). That breaks the no-religious-content-outside-Halaxis lock. The prompt also said sign-in was "magic-link first" and mentioned "office ledger debits".
- What: the copy now says 1,000 Ixis in `app/login/page.tsx` and `components/ApixisWorldWelcome.tsx`, plus comments in `lib/renoxis/apixis-entry.ts` and `lib/renoxis/world-agent.ts`, docs `docs/APIXIS_FAMILY.md`, `docs/CIXY_BRAIN.md`, `docs/LAUNCH_STATUS.md` (the 09-28 verification keeps 200 as history), and the test mock `tests/world-agent.test.ts`. This reuses the reviewed 2026-09-29 WIP from `chore/signup-grant-1000`. The canonical `lib/apixis-world*.ts` parts were already done by Claude's #33, so they were dropped. In the Cixy prompt I removed the religious identity, phrases and HALAL block and kept one neutral line: "Honest dealing: no deceptive marketing and no hidden material terms". Sign-in is now described as "Log in with Apixis ID" first, and the prompt states there is no Renoxis balance, the Wallet is shared, and 1,000 Ixis is granted on Apixis.dev. `tests/cixy-prompts.test.ts` now guards these points. The grant itself is unchanged: there is still no local grant, and it is given on Apixis.dev.
- Not touched: theme (red default coat + Emerald/Sunset/Night switcher, as live), SVGs, Stripe, Wallet code, env, DB, layout.
- Checks: 71/71 node tests, `tsc --noEmit`, `npm run lint` (0 errors), `npm run build`.
- Who: Grok Bot for Awad. Opened as preview-only. 313aidaroos merged it at 18:54 CT as squash `0b1ff67`, and it went to production (`dpl_AkrNuzCMW93UqLoVs7PWxsVt4XMR`, then `8168cd0`).
- Undo: `git revert 0b1ff6702d744d48e0b53154b8a44626ff38d306`.

## 2026-10-04 (CT) — Grok: correction to the 8168cd0 catch-up note
- What: commit `8168cd0` ("notes: fix 10-04 catch-up") credited PR #42 to "Claude/lead audit". Grok Bot (Renoxis lead) wrote #42, not Claude. Claude's only work today is #41. I fixed that one line. The top summary stays as 8168cd0 left it.
- Undo: revert this PR's merge commit.

## 2026-10-04 (CT) — Grok: Cixy character "draws on Arab culture" (Awad's decision via hub)
- What: the Cixy system prompt line now reads "your character draws on Arab culture". It does not say "Muslim" and has nothing religious. Tests require "draws on Arab culture" and still ban muslim / halal / shariah / riba / gharar / insha'Allah / alhamdulillah / salaam / prayer.
- Where: `lib/renoxis/cixy-prompts.ts`, `tests/cixy-prompts.test.ts`.
- Who: Grok Bot for Awad.
- Undo: revert this PR's merge commit, which takes the line back to #42's version with no culture mention.

## 2026-10-04 (CT) — Grok: Apixis ID is the only signup (Awad's decision via hub)
- Before: the Renoxis email link (`signInWithOtp`) created a Supabase user for any new email, and /login, the home sign-in dialog and the Cixy help said "New here? The link starts your account".
- What: both `signInWithOtp` calls (`app/login/page.tsx` email-link tab and `components/LoginForm.tsx` in the home dialog) now pass `emailLinkOptions()` from the new `lib/renoxis/email-link.ts`, which always sets `shouldCreateUser: false`. Existing Renoxis email accounts still get their link. An unknown email gets "There’s no Renoxis email account for that address. New here? Choose Log in with Apixis ID to create your account." Updated copy:
  - /login: "New here? Create your account with Apixis ID. It comes with your own Apixis world agent and 1,000 Ixis to start." The divider reads "Already have a Renoxis email account?" and the email tab note reads "Already have a Renoxis email account? Sign in with your email link. New here? Use Log in with Apixis ID above."
  - The home dialog and the Cixy help card say the same. No restyle: the same elements and classes are used.
  - Apixis ID sign-in still creates the Renoxis user server-side (`lib/apixis-login.ts`, admin `createUser`). That is unchanged.
  - The Password tab only signs in. It never signed anyone up.
- Where: `lib/renoxis/email-link.ts` (new), `app/login/page.tsx`, `components/LoginForm.tsx`, `components/WelcomeExperience.tsx`, `components/CixyHelp.tsx`, `tests/email-link.test.ts` (new: asserts `shouldCreateUser === false` and that every `signInWithOtp` call uses the helper).
- Not done here, needs the hub or Awad: Supabase project `loyjbfqpanskcecvpolt` still allows email signups at the Auth settings level. This change closes the app path only. If someone turns off "Allow new users to sign up" there, test Apixis ID first-time sign-in right after, because it creates users through admin `createUser`. No DB or Auth-config change was made.
- Who: Grok Bot for Awad.
- Undo: revert this PR's merge commit.

## 2026-10-04 (CT) — Grok: Vercel env changes on project `renoxis` + production redeploy (Awad approved via hub)
- `APIXIS_WORLD_KEY`: re-saved as type **sensitive** with the same value on Production and Preview. I pulled the value with `vercel env pull` into a mode-700 temp dir in /tmp, outside the repo, and deleted the dir right after. The value was never printed. Production and Preview had the same value (I compared length and a short hash only). Steps, back to back within seconds: (1) narrowed the old `encrypted` record `x4e5y01asH7DmSaN` to Development only, because a sensitive var cannot target Development; (2) `vercel env add APIXIS_WORLD_KEY production --sensitive` and the same for `preview`, with the value piped through stdin. Development keeps the old readable record. No new key was minted.
- `ANTHROPIC_MODEL`: `claude-sonnet-4-6` → `claude-sonnet-5` on record `rNDLwDla9IQVr3qy`. That one record covers Production, Preview and Development, so Development changed too.
- Redeploy: production was redeployed from the current main (`8168cd0`, which already includes #42) with `vercel redeploy` of the live production deployment. Nothing from this PR was promoted. See the smoke-test entry for the deployment ID.
- Who: Grok Bot for Awad (approved through the hub).
- Undo: set `ANTHROPIC_MODEL` back to `claude-sonnet-4-6`. For `APIXIS_WORLD_KEY`, delete the two sensitive records and set record `x4e5y01asH7DmSaN` back to targets production, preview and development. Then redeploy production.


## 2026-10-04 (CT) — Grok: production redeploy + smoke test after the env changes
- Deploy: `vercel redeploy` of the live production deployment (`dpl_nUFugR4mxHQmDkV9uowQvyrCt5yL`, `8168cd0`) produced `dpl_2nbsTXLKjAQcua4jW7ESEavcxjB6` (renoxis-30tx87v1l…), READY at about 18:57 CT on main `8168cd0d4b2a108afde1d305c85867f63b6205ae`, aliased to renoxis.dev.
- Smoke test (test account grok-renoxis-1790732864@uberip.com):
  - Apixis ID sign-in reached /dashboard.
  - The balance pill (`/api/wallet/balance` 200, linked) and the "Your agent is ready" card (now says 1,000) load.
  - `/api/feed-session` returned 200 with ok:true and a token. That route calls Apixis.dev with `APIXIS_WORLD_KEY`, so the sensitive key works in production.
- Cixy on `claude-sonnet-5`: **not verified end to end.** `/api/chat` returns 402 (no seat) for the test account, and I did not grant one (no DB or Wallet change). The code sends `thinking: {type:"disabled"}` with no sampling parameters, which Anthropic's Sonnet 5 docs list as accepted. The response carries no model header.
- Runtime logs for the new deployment show no error, warning or fatal lines. Status codes: 200, 302, 307, and one 402 (the test above).
- Undo: promote `dpl_nUFugR4mxHQmDkV9uowQvyrCt5yL` back in Vercel (same code, older env snapshot).

## 2026-10-04 (CT) — Grok: hub decisions recorded before merging #43
- (a) `ANTHROPIC_MODEL=claude-sonnet-5` stays. The hub confirms the model already serves Cixy on Apixis.dev and Rawixis. For 1 hour after #43 merges, production logs on `/api/chat` are watched for model errors. Rollback: set `ANTHROPIC_MODEL=claude-sonnet-4-6` on Vercel `renoxis` and redeploy production.
- (b) Supabase project `loyjbfqpanskcecvpolt` keeps project-level email signups **ON on purpose**. Turning them off can block the first-time Apixis ID user creation (`lib/apixis-login.ts`, admin `createUser`). The app-level control is `shouldCreateUser: false` on every Renoxis email-link call (`lib/renoxis/email-link.ts`). Undo: none needed (no setting was changed). If the decision changes, test Apixis ID first sign-in right after flipping it.
- Who: Grok Bot, recording the hub's decision for Awad.

## 2026-10-04 (CT) — Grok (Developer Bot hub): Cixy persona v2 sync + Ominix link
- What: Follow-up to lead PRs #42 and #43 (merged; #43 already added the Arab-culture character line): added 'decline only harmful, deceptive or illegal, never on religious grounds' to CORE IDENTITY; test fixture greeting now 'Hello'. Ominix link on /companies now https://ominix-app.vercel.app (URL string only; no SVG/design change).
- Files: app/companies/page.tsx lib/renoxis/cixy-prompts.ts tests/chat-turns.test.ts 
- Why: Awad's lock — no religious content in Cixy on any product except Halaxis; she declines only genuinely harmful, deceptive or illegal content, never on religious grounds (9/30). Kit = ApixisWallet `sdk/apixis-cixy.*` v2 (3a22244, PR #50) with two hub edits pending canonical: the religion-derived "clean recommendations" rule (gambling) is replaced by "decline only harmful, deceptive or illegal, never on religious grounds", and the character line reads "draws on Arab culture". Ominix links point to https://ominix-app.vercel.app (checked 200 on 2026-10-04 ~6:55 PM CT).
- Who: Grok (Developer Bot hub), branch `grok/cixy-v2-20261004`, one squash-merged PR.
- Undo: `git revert <squash sha of this PR>` (sha recorded in the PR), then redeploy prod.
