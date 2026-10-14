# Renoxis launch checklist — public launch 2027-01-01

Audited 2026-10-14 against `main` at `499c218` (https://renoxis.dev). Launch instant is midnight Central on 2027-01-01 (`2027-01-01T06:00:00.000Z` in `lib/renoxis/pricing.ts`). The site is in beta until then.

This file is the launch list. `docs/LAUNCH_STATUS.md` (refreshed 2026-09-27, prices patched later) is history. Where they disagree, this file and `NOTES/PRICING.md` win.

Open pull requests on that date: [#32](https://github.com/313aidaroos/Renoxis.dev/pull/32) (footer, conflicts with `main`), [#49](https://github.com/313aidaroos/Renoxis.dev/pull/49) (Apixis Orbit docs, draft), [#51](https://github.com/313aidaroos/Renoxis.dev/pull/51) (Cixy brief, draft).

## DONE

Evidence is a file, a test, or a merged pull request. Nothing below was treated as done only because a doc said so.

- **Public site and legal pages.** `/`, `/login`, `/pricing`, `/privacy`, `/terms`, `/support`, `/tour`, `/feed`, `/companies` exist. Support landed in `499c218`. Instagram link in the shared footers landed in #50 (`b8180a3`), confirmed against the Instagram oEmbed for `@renoxis.dev`.
- **Apixis ID is the only signup.** `lib/renoxis/email-link.ts` sets `shouldCreateUser: false`. `tests/email-link.test.ts` pins every `signInWithOtp` call. There is no `/signup` route and no password signup. The only account create is the Apixis ID callback (`lib/apixis-login.ts`).
- **One shared Wallet. No local Ixis grant. No Renoxis Stripe.** Prices live in `lib/renoxis/pricing.ts`. Seat redeem goes through `lib/renoxis/redeem-seat.ts` → Wallet `redeem()`. Job charges go through `lib/renoxis/wallet-charge.ts`. `NOTES/PRICING.md` and `docs/APIXIS_FAMILY.md` match. A repo search shows no Stripe secret and no local balance credit.
- **Locked prices.** Start fee $50 / 5,000 Ixis, SKU `renoxis.activate`. Monthly is $50 / 5,000 Ixis on `renoxis.agent.monthly` until `2027-02-01T06:00:00.000Z`, then $100 / 10,000 Ixis on `renoxis.agent.monthly.10000`. `getMonthlyPrice` switches it. `tests/pricing.test.ts` locks the dates and the SKUs.
- **Card billing says coming soon, on purpose.** `CARD_BILLING_COPY`, `components/SeatPay.tsx`, and `components/PricingCheckout.tsx`. The shared Apixis Stripe sells Ixis packs. This repo does not add a card form.
- **Seat entitlement is server-side.** `renoxis_entitlements` is service-role only (`lib/renoxis/entitlements.ts`). Records writes, chat, listing copy, and Cixy drafts call it. `tests/billing.test.ts` guards the `await` (a missing `await` once left the listing paywall open).
- **Insufficient-funds path exists in code.** Seat redeem returns 402 with `insufficient: true` and a Buy Ixis URL (`lib/renoxis/redeem-seat.ts`). `components/SeatPay.tsx` shows that link. Job charges return 402 from `chargeFromWallet`. A live Wallet rehearsal is still in NEEDS AWAD.
- **Paid drafts.** Email 50 and offer letter 100 go through `chargeOfficeJob` / the person's Wallet. The draft is removed if the charge fails (`app/api/cixy/draft/route.ts`). `/api/brokerage/grant` returns 410 (the office ledger grant is retired).
- **Brokerage tab, in the repo.** Create or rename an office, add people without sending mail, roster, and office-Wallet billing in `lib/renoxis/office-billing.ts`. The office pays for email, offer letters, and property lookups (25). Closed-deal cut is 5% pending. The follow-up SQL file is in the repo and is not applied. See NEEDS AWAD.
- **World-agent code.** First Command Desk load can call Apixis `POST /api/agent/provision` once and store `app_metadata.apixis_world_agent_at` (`lib/renoxis/world-agent.ts`). Copy says 1,000 Ixis. The grant is on Apixis, not here. A live check of exactly one agent is still in NEEDS AWAD.
- **Cixy stays secular.** `lib/renoxis/cixy-prompts.ts` says the character draws on Arab culture. `tests/cixy-prompts.test.ts` bans religious wording. No second Cixy knowledge base was added in this audit.
- **Badge and tour copy from the 2026-09-27 bug list are already fixed on `main`.** Public shells say “A Apixis Company” (header small-caps and footer). The tour wallet stop says the office Wallet, not an office ledger (`lib/renoxis/tour.ts`). `checkBalance` / `insufficientMessage` are gone from `lib/renoxis/ixis.ts`.
- **CI.** `.github/workflows/ci.yml` calls the shared Node workflow on push and pull request (#34).

## TODO WITHOUT AWAD

Safe to do in the repo. No live secrets, no production deploy, no live SQL, no merge, no email, no local Ixis grant.

Done in the draft that adds this file (branch `cursor/launch-safe-gaps-b653`):

- **Phone header.** At 700px and under, `.welcome-header nav > a { display: none }` hid every link, including Sign in on `/support` and Open dashboard on `/feed`. The signed-in home link was the only exception. The rule now keeps `.primary`, `.auth-home-link`, and `.nav-keep`. Companies and Feed stay on the home and feed headers. The header can wrap. `tests/public-shell.test.ts`.
- **Support cancel copy.** `/support` said you can cancel from workspace settings. There is no cancel control. The answer now says card auto-renew is not available, Ixis renewal is from the workspace, and there is no cancel button. Mail stays `renoxis@apixis.dev`.
- **Document writes.** `POST` and `DELETE` on `/api/documents` did not check the seat. Record writes already did. Both document mutations now call `requireServerEntitlement`. Listing your own files stays available, same as reading your own records. `tests/billing.test.ts`.
- **Listing-copy Wallet note.** `app/api/listings/generate/route.ts` told the next editor to reserve 1,000 Ixis. That number is the signup grant. There is no listing-copy SKU. The route still requires a seat and still does not redeem. The page already says no Ixis charge is made. A test forbids `redeem(` and a 1,000 Ixis charge in that file.
- **Listing error.** A failed generate used to land in the result box as plain text. It is now a `role="alert"` message.
- **Node 22.** `package.json` `engines.node` is `>=22`, because `npm test` uses `--experimental-strip-types`.

Still open, and still not an Awad blocker:

- **Real iPhone Safari.** This pass is a 390px and 1280px browser check of the public pages. It is not a physical phone, Add to Home Screen, or the signed-in Command Desk. The desk already has a menu button under 650px (`components/command-desk.css`).
- **Footer of other Ixis companies.** #32 conflicts with `main` (DIRTY). The link list is rebased in a separate draft. Do not merge #32 as it stands. Pinixis, Launchixis, and Ominix are on `/companies` and were left out of that 11-link row on purpose in #32 (Awad’s exclusion list from 2026-09-30 also dropped Qahwah World and Nursery Toons). Changing that list is a decision, so it stays out of the rebase.
- **`docs/LAUNCH_STATUS.md` progress percents and the 2026-09-27 bug table are stale.** This checklist replaces them for launch. Rewriting the old file is optional.
- **Listing generator chrome.** `/listings/generate` still uses a plain page, not the Command Desk. Aligning it would be a restyle. Left alone.
- **Cixy prompt price line on `main`.** One bullet still says the monthly plan is $100 only and skips the $50 launch month (`lib/renoxis/cixy-prompts.ts`). Draft #51 already teaches the promo, the EHV window, and the wholesale dates, and it keeps the prompt secular. Do not open a second prompt edit.

## NEEDS AWAD

True blockers only: secrets, a sign-in, a real spend or send, a decision, a merge, or SQL on the live database.

- **Apply `supabase/migrations/20261006120000_brokerage_office_wallet.sql` to project `loyjbfqpanskcecvpolt`.** Not applied. It sets the SQL property-lookup price to 25 and lets a manager remove an agent or assistant. Do not run it from the app or from an agent.
- **Merge the drafts, or close them.** #32 conflicts and should be closed in favor of the rebase once that rebase is accepted. #49 is Orbit docs only (`runtimeConnected: false`); merging it does not turn Orbit on, and it still needs a yes. #51 is the Cixy brief; the prompt change needs a yes. None of these were merged here.
- **Signed-in Apixis ID smoke on production.** Confirm one new Apixis ID lands on `/dashboard` with the shared Wallet balance, the 1,000 Ixis grant visible from the Wallet (not granted by Renoxis), and exactly one world agent. Needs a real sign-in. Last recorded smoke is 2026-10-04 (`NOTES/GROK.md`) and did not re-check the grant or the single-agent rule after later deploys.
- **Live Wallet redeem rehearsal.** Activate (`renoxis.activate`, 5,000), monthly (`renoxis.agent.monthly`, 5,000 until 2027-02-01), email draft (50), offer letter (100), and the insufficient-funds path (402, then Buy Ixis, then return). That spends real Ixis. The code path is in DONE. The browser rehearsal is not.
- **Publish `renoxis.agent.monthly.10000` in the Wallet catalog** before 2027-02-01. Wallet Lead owns that id. This repo must not point the $100 price at `renoxis.agent.monthly` (that row is 5,000).
- **Card subscription billing.** Stays “coming soon” until the shared Apixis Stripe can sell the seat. Do not add Stripe keys to Renoxis.
- **Closed-beta invite wall, if you want one.** A paid seat already requires Wallet capture, except a confirmed owner (`lib/renoxis/owners.ts`) or `RENOXIS_BETA_GRANT_EMAILS` / `RENOXIS_BETA_GRANT_USER_IDS`. Any Apixis ID can create an account. There is no invite code on signup. Turning signup into an invite list is a product decision. Supabase “allow new users to sign up” stays on so the Apixis callback can `createUser` (recorded 2026-10-04).
- **Listing-copy price.** If generation should cost Ixis, name the SKU and the amount. 1,000 is the wrong number. Property lookup (25) is a different job (typed facts on the Team board).
- **Google OAuth, Outlook, and MLS.** Deferred. Google start/callback routes exist and need `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` if you want them. Outlook and MLS are not built. `CONNECTION_ENCRYPTION_KEY` on Vercel is an open question from `NOTES/CLAUDE.md`.
- **Phase B send.** Approved drafts are not emailed. `/api` must not start sending.
- **Seat-payment GitHub workflow.** `docs/ci/seat-payments.yml` is a doc, not an active workflow. Turning it on needs a token with workflow scope.
- **`renoxis.vercel.app` → `renoxis.dev`.** Sign in with Apixis on the Vercel host returns the session to the apex. A host redirect is a domain setting.
- **AI Receptionist.** Not started, on purpose. Do not build it here (`docs/APIXIS_FAMILY.md`, D18).
- **Production deploy.** Nothing in this audit is deployed. `main` moves to production only when you say so.
