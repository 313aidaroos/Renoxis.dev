# Renoxis launch brief — September 20, 2026

Production URL: https://renoxis.vercel.app
Repository: https://github.com/313aidaroos/Renoxis.dev

## Delivered

- Existing site rebuilt around the approved emerald/white design and central female Cixy office; no duplicate frontend or repository.
- Cixy smile, wave, sleep, snack and coffee sprite animations. Motion controls, activity cycling, reduced-motion support and an editable illustrated avatar with skin/hair/eye/blazer colors, hairstyles and office palettes.
- Cixy Studio catalog: basic controls included at 0 Ixis; premium collections marked Coming soon with null prices for Awad to set. No wallet charges or invented balances.
- Saved leads, clients, properties, transactions, tasks, appointments, renovation briefs, social drafts, document links and workspace preferences.
- Zero-state dashboard: pipeline and commission forecast calculated from the signed-in account’s records; no fixed sample revenue or deals.
- Private file upload, listing, deletion and short-lived download links. Supported PDF/PNG/JPG/text files up to 4 MB.
- Search, record editing/deletion, follow-up tasks, export, FAQ tab, account actions, responsive mobile menu, PWA manifest/icons and install instructions.
- Google OAuth/backend wiring, encrypted credential storage, read-only inbox, calendar fetch, reviewed idempotent appointment creation and disconnect. Requires provider configuration below.
- Existing Cixy chat and listing-copy generation retained. Cixy receives a limited read-only workspace snapshot. AI request limits: 10/minute and 100/day/account, enforced atomically in the database.
- App-version handoff: `docs/APP_VERSION.md`. Customization catalog and asset plan: `docs/CIXY_CUSTOMIZATION.md`; live catalog source: `lib/renoxis/customization.ts`.

## Verified before deployment

- Production build and TypeScript compilation passed.
- ESLint passed; pure validation/totals tests passed (3 tests).
- Real Supabase tests with two temporary QA accounts: API authentication, create/read/update/delete, second-account isolation, stale-version conflicts and numeric validation.
- Direct database tests: row-level read isolation, ownership spoof rejection, token-table access denial and atomic AI rate limit.
- Private file upload, signed download URL, cross-account denial and deletion passed.
- Browser tests: every main navigation tab, FAQ expansion, sign-in dialog, Cixy color save/reload, manual activity choice, authenticated lead creation and reload, mobile navigation, no horizontal overflow at 390px and no browser page errors.
- Desktop and mobile screenshots inspected.
- Fixed a same-origin save rejection discovered during actual browser testing.

## Requires owner/provider setup

1. Google OAuth credentials and consent/verification for Renoxis, canonical APP_URL, service-role key and 32-byte encryption key in Vercel. See `docs/CIXY_CONNECTIONS.md` and `.env.example`. Code is implemented; real Google authorization/refresh/revocation/calendar writes have not been end-to-end tested without those credentials.
2. Verify production `ANTHROPIC_API_KEY` and desired model in Connections. Paid AI generation was not exercised in this build's tests; configured is not the same as a verified provider response.
3. Verify Supabase email delivery and redirect allowlist includes `https://renoxis.vercel.app/auth/callback` and any intended custom domain. No test email was sent. Existing auth settings were not changed.
4. Awad supplies premium Ixis prices and chooses outfit/office/background assets. Wallet purchases remain disabled until server-side billing and entitlements are integrated.
5. Outlook, MLS feeds, external CRM sync, email sending, social publishing, renovation image generation and shared cross-company Cixy memory need their provider/API contracts. These are not represented as active features.

## Known practical limits

- Signature artwork uses two-frame activity sprites, not a generated video or a layered recolorable character. Color controls use the clearly labeled illustrated mode.
- Appearance preferences save on-device, not across devices. Chat history is session-local.
- Calendar publishes confirmed events without attendees; conflict checking and automatic email extraction are not implemented.
- Workspace list/export currently uses the newest 1,000 records and warns if truncated. File listing is capped at 100. Larger workspaces need pagination.
- PWA is online-first, not an App Store binary. No private offline cache or push notifications.
- Supabase advisor: server-only connections table intentionally has RLS with no customer policies and no customer grants. Existing leaked-password protection setting is disabled; the UI uses magic-link login.

Deployment confirmation will be recorded against the final GitHub commit/check, and the live site should be checked before sending the 9 a.m. brief.
