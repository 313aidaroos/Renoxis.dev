# Renoxis launch status — refreshed 2026-09-27

Production: https://renoxis.dev (canonical; `www` 308s to apex). https://renoxis.vercel.app still serves the same build.
Repository: https://github.com/313aidaroos/Renoxis.dev
Production deployment: `ef3712e` (PR #23), which matches `main` HEAD.
Supabase project: `renoxis` (`loyjbfqpanskcecvpolt`). All 9 repo migrations applied, including `seat_payment_attempts`.

This file replaces the Sep 20 brief. It records only what was checked on 2026-09-27 or is proven by merged PRs.

## Locks (owner, current)

- **Payments only via Apixis Wallet.** No Renoxis Stripe, no Renoxis Ixis balance. 100 Ixis = $1, closed-loop credit.
- **Plan:** `renoxis.activate` 5,000 Ixis ($50) one time, `renoxis.agent.monthly` 10,000 Ixis ($100) every month. Pay by card or with Ixis. The Ixis redeem path is unchanged. The Wallet catalog for `renoxis.agent.monthly` must be 10,000. Server-side entitlement only.
- **Paid drafts** from the person's own Wallet via redeem: `renoxis.email_draft` 50, `renoxis.offer_letter` 100. Property record and contact tracking are free. The office Ixis ledger was retired in PR #18 (manual grants return 410).
- **Platform cut:** closed-deal fees record a 5% (500 bps) cut as pending.
- **Apixis Bank (2026-09-27):** Apixis takes 5% of every transaction in the Apixis universe, including in-world Ixis transfers, trades, purchases and agent-to-agent deals. That fee is applied by Apixis Wallet / Apixis.dev, not by Renoxis code.
- **Apixis world agent (2026-09-27):** every signup gets their own Apixis world agent through Apixis ID (Wallet SSO). Entry: `https://www.apixis.dev/enter?from=renoxis`. Cixy stays the guide, not the user's avatar. Arrivals start with 1,000 in-world Ixis on Apixis.dev. Rollout order: Apixis.dev, then Renoxis, then other products.
- "A Apixis Company" badge on every surface including mobile. Emerald CommandDesk theme is a hard rule.

## Done (live on production)

| Item | How it was verified |
|---|---|
| Prod build equals main (`ef3712e`) | Vercel production deployment list, 2026-09-27 |
| `/`, `/login`, `/privacy`, `/terms`, `/pricing` return 200 on renoxis.dev | curl, 2026-09-27 |
| Custom domain renoxis.dev live, www redirects | curl, 2026-09-27 |
| Sign in with Apixis start route | `/auth/apixis/start` 302s to Wallet `/sso/authorize?client_id=renoxis` with callback `https://renoxis.dev/auth/apixis/callback` |
| Magic-link login + password tab + `/set-password` | Merged (db9004d); magic-link signed-in smoke passed 2026-09-22 |
| Server-side seat entitlement, recoverable seat payments without double renewal | PRs #11, #20; migration applied on prod Supabase |
| Paid drafts via personal Wallet redeem, draft removed if charge fails | PR #18 (tests in repo) |
| Cixy chat answers when entitled; drafts download / Save to Documents, never sends | Prod smoke 2026-09-22; PRs #13–#15 |
| Shared Cixy brain pack applied (lookup 0, locks) | PR #19 |
| Apixis world entry: one-time first-run card + persistent sidebar link to `https://www.apixis.dev/enter?from=renoxis` | PR #23, deployed |
| Privacy + Terms pages | 200 on prod |

Local checks on `main` (2026-09-27): 60/60 unit tests pass (Node 22), `tsc --noEmit` clean, ESLint 0 errors / 2 warnings, `next build` succeeds.

## Not done

1. iPhone Safari pass and mobile badge check on a real device.
2. Signed-in end-to-end smoke of Sign in with Apixis (Wallet SSO) on production after PR #18/#20.
3. Real Wallet redeem rehearsal on production for Activate, monthly renewal, email draft and offer letter (the Stripe sandbox browser rehearsal is still pending on the Wallet side).
4. Apixis world entry verified end to end: signup, then own agent created on Apixis.dev with 200 in-world Ixis (the grant at that time; raised to 1,000 for new signups on 2026-09-29).
5. Invite restriction check for closed beta (who can reach a paid seat without Wallet capture).
6. Phase B outbound send (Approve-gated outbox). Deferred.
7. Google OAuth, Outlook, MLS feeds. Deferred.
8. Seat-payment CI workflow (`docs/ci/seat-payments.yml`) is not active because the GitHub token lacks workflow scope.

## Bugs found 2026-09-27 (not fixed in this docs PR)

| Severity | File | Symptom |
|---|---|---|
| Medium | `components/WelcomeExperience.tsx`, `app/login/page.tsx`, `app/pricing/page.tsx`, tour pages | "A Apixis Company" badge is absent on the public homepage, login, pricing and tour. It appears only inside the Command Desk and legal pages. Breaks the badge hard rule for signed-out visitors, including on phones. |
| Low | `lib/renoxis/tour.ts` (wallet stop) | Welcome tour still says "Ixis & office ledger" and "Office actions use the office ledger". The office ledger was retired in PR #18; drafts now charge the person's Wallet. |
| Low | `components/WelcomeExperience.tsx` | Price box says "Some office draft actions cost additional Ixis". Should say drafts are paid from your Apixis Wallet. |
| Low | `lib/renoxis/ixis.ts` | `checkBalance` / `insufficientMessage` still describe an office balance; appear unused after PR #18. Dead code with stale copy. |
| Low | `package.json` | `npm test` uses `--experimental-strip-types`, which fails on Node 20 ("bad option"). Needs Node 22+ or an `engines` field. |
| Low | Domain setup | Starting Sign in with Apixis on `renoxis.vercel.app` returns the session to `renoxis.dev`. Redirecting the vercel.app host to renoxis.dev would avoid a signed-out surprise. |
| Trivial | `components/CommandDesk.tsx` | ESLint warnings: unused `loginForm`, `activateHref`. |

## Open PRs

- #1 "Add wholesale contract-sale / assignment dispo playbook" — draft since 2026-09-21, stale. Content is superseded by the shared Cixy brain pack (PR #19). Candidate to close.

## Progress estimate

- Closed-invite beta: about 85%. Remaining: mobile/iPhone pass, Apixis SSO signed-in smoke, invite restriction check, badge on public pages.
- Public launch: about 60%. Also needs a real Wallet redeem rehearsal, the world-agent flow verified end to end, the stale ledger copy fixed, and a decision on Phase B send.
