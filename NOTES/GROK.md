# NOTES/GROK.md

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
- Where: `feed-client/` (shared copyable client), `app/feed/` (page in the welcome-shell header/footer, Renoxis skin, `feed.css` mapped onto Renoxis colors/fonts), `app/api/feed-session/route.ts` (mints the browser feed token server-side with `APIXIS_WORLD_KEY`), one link each in `components/WelcomeExperience.tsx` and `components/CommandDesk.tsx`, `tests/feed-client.test.ts`.
- Who: Grok (for Awad). No DB/env/Wallet changes. No SVGs.
- Undo: `git revert <merge sha>` of this PR.
