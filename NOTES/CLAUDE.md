# Claude notes (Renoxis)

Dated notes from Claude (Claude Code), same purpose as `NOTES/GROK.md`: what Claude checked or changed here, what it found, what is still open and who owns it. The one family status board is `ApixisWallet/docs/FAMILY_STATUS.md`.

## 2026-10-04 (UTC) — Claude: full-portfolio review (read-only; this note and the AI_CHANGELOG line are the only changes)

### Snapshot
- Reviewed `main` @ `488674a` (#37); Grok merged #38 Feed tab while I read → `main` is `a044c43`. Vercel `renoxis` production READY at renoxis.dev.
- Supabase `loyjbfqpanskcecvpolt`: 9 tracked migrations, all applied (renoxis_workspace, ai_request_limits, brokerage_v1 ×6, seat_payment_attempts).

### Verified this session (on 488674a)
- `npm run lint`, `typecheck`, `test` (node --test with strip-types, 16 files), `build`: all pass on Node 22. `test:sql` needs a Postgres — not run.
- SDK: wallet, login, redirect, world provision identical to canonical; `apixis-world.ts` one revision behind like every site (Renoxis uses its own `lib/renoxis/world-agent.ts` on top).
- Advisors: only RLS-no-policy INFO on `renoxis_connections`, `renoxis_entitlements`, `renoxis_seat_attempts` (server-only) — the cleanest project in the family; no leaked-password warning here.

### Done (live)
Emerald command desk, account-scoped CRM / appointments / tasks / private documents / commission forecasts / FAQs, Cixy chat + per-use drafts (`renoxis.email_draft` 50, `renoxis.offer_letter` 100 Ixis), listings generator, brokerage v1 team workspace (invites, members, notes, outbox, grants), Google connections (OAuth start/callback/sync), seats via the Wallet (activate + monthly; `seat_payment_attempts`), Apixis ID + magic link + reset, world agent + welcome card, pricing / terms / privacy / tour, PKCE + `apixisSubOf`, CI, Feed tab (#38).

### Open — needs Awad
- Google OAuth client (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, redirect `https://renoxis.dev/api/connections/google/callback`) — optional.
- PR #32 footer (per the family board).
- Premium Cixy assets have no prices yet; `CONNECTION_ENCRYPTION_KEY` set on Vercel?

### Open — Claude can do on your go
- **User-facing copy bugs:** `components/ApixisWorldWelcome.tsx:44` "200 in-world Ixis to start" and `app/login/page.tsx:137` "…your own Apixis world agent and **200 Ixis** to start" (D11 = 1,000). Same number in `lib/renoxis/apixis-entry.ts`, `lib/renoxis/world-agent.ts` comments and in `docs/APIXIS_FAMILY.md`, `docs/CIXY_BRAIN.md`, `docs/LAUNCH_STATUS.md`.
- `app/companies/page.tsx` links Ominix to `nexxis-tau.vercel.app` (retired host).
- `.env.example` defaults `ANTHROPIC_MODEL=claude-sonnet-4-6` while the family default elsewhere is `claude-sonnet-5`.
- PR #37 (10-02) and #38 (10-04) were merged with no `AI_CHANGELOG.md` entry — the owner's rule was missed twice.
