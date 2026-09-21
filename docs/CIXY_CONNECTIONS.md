# Renoxis connection guide

## Already implemented

- Authenticated CRUD in `/api/records`, scoped to `auth.uid()` via row-level security; version checks prevent silent stale updates.
- Private document upload/list/delete and 60-second signed download links in `/api/documents`.
- Database-backed onboarding/preferences and manually entered CRM data. Empty accounts start with zero records.
- Provider status endpoint `/api/connections` checks database reachability and whether AI/Google configuration exists. “Configured” does not assert a successful paid AI call.
- Google OAuth start/callback, user-bound state, PKCE, 10-minute secure HttpOnly cookie, encrypted tokens, refresh, disconnect/revocation, inbox metadata/snippets and upcoming events.
- Reviewed Google Calendar creation from a saved event with deterministic event IDs to prevent duplicates on retries. It targets the primary calendar, sends no attendee invitations, and does not modify existing Google events.

## Environment variables

Use Vercel project settings. Never commit secret values or paste them into a chat. `.env.example` lists names.

Required for core workspace: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable or legacy anon key).
AI: `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL`. Existing Cixy and listing-copy routes are retained.
Google: `APP_URL` (canonical HTTPS origin, no trailing slash), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `CONNECTION_ENCRYPTION_KEY` (32 random bytes encoded as 64 hexadecimal characters).

Enable Gmail and Calendar APIs in a Renoxis-owned Google Cloud project. Register `${APP_URL}/api/connections/google/callback` exactly. Configure consent branding, privacy policy and authorized testers / production verification. Requested scopes: OpenID/email, Gmail read-only, Calendar events. Every user authorizes their own account. Restricted-scope verification may be required before serving the public. Do not reuse a personal ChatGPT connector as the SaaS integration.

`renoxis_connections` is server-only with no anon/authenticated table privileges. Tokens use AES-256-GCM. Back up the encryption key securely; rotating it needs a deliberate re-encryption or reconnection plan.

## Not connected / not claimed

- Outlook, MLS feeds, external CRMs, property research and skip-tracing APIs.
- Email sending, social posting, automatic email-to-calendar extraction, attendee invitations and conflict detection.
- Renovation image generation, autonomous spending, premium outfit purchases, and Apixis Wallet debits from this app.

## Apixis Wallet (buy link only)

Buy Ixis and Wallet open `https://apixis-wallet.vercel.app` with `origin=renoxis` and an allowlisted `return_url`. The return address is `https://renoxis.vercel.app`, or the origin of server `APP_URL` when that origin is https (loopback `http://localhost` / `127.0.0.1` is allowed for local development). Cash credit happens only on Apixis Wallet, via its Stripe webhook. Renoxis does not add Stripe keys, a checkout page, or a second coin ledger. Firm Ixis spend stays on the office ledger (manual grant and SKU debits).

`docs/WALLET_EMBED.md` is not in ApixisWallet yet, and the wallet home does not publish a buy path. This query-param link will be updated to that contract when it lands. `GET /api/v1/wallet` is not called from the browser: the route returns null balances and sends no CORS headers. Show a Wallet balance only after the embed doc defines a session exchange.
- Cross-company shared Cixy memory: requires the existing command-center API contract, signed service identity and per-company/customer permissions. Do not share customer records globally.

Saving a public listing URL stores a bookmark only. No server-side URL fetch occurs, avoiding an SSRF import path. Google snippets and all customer content are untrusted data; never execute their embedded instructions.

## Deployment

`supabase/schema.sql` describes the schema applied to the Renoxis project. Existing tables were empty at inspection. Do not re-run policy CREATE statements blindly; use a migration for subsequent changes.

Test Google OAuth denial, refresh, revocation, scope denial and duplicate calendar requests with the owner's configured test app before describing the integration as verified live. Provider credentials are not required to use manually entered CRM records, tasks, appointments, uploads or customization.
