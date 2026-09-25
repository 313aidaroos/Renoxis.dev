# Renoxis: launch notes

_Updated 2026-09-25. One notes file per repo: what was changed, file by file, and everything you need to connect. The full family report: https://claude.ai/artifact/QERxA6PMsFK1vdR51Ex2NQ_

## Status

Ready after keys. No changes needed.

## Connect (in order)

1. **Apixis Wallet key.** In the ApixisWallet repo run `npm run family-keys` once. It prints one SQL block (paste it in the Wallet's Supabase SQL editor) and one env block per site. Paste this site's block: `WALLET_API_KEY`, `APIXIS_CLIENT_ID`, `APIXIS_WALLET_API_URL`.
2. Supabase and AI: see `.env.example`.
3. **Sign in with Apixis** (added by the Codex payment-hardening PR #20, `lib/apixis-login.ts`): uses the same `APIXIS_CLIENT_ID` from family-keys. The Wallet already registers `https://renoxis.dev/auth/apixis/callback`. Set `APIXIS_REDIRECT_URI` only if the domain differs.

Every key this repo reads is listed in `.env.example` (required, optional, and legacy names to leave unset).

## OAuth apps

- **Google**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (see `.env.example` for the redirect).

## Apixis Wallet

App `renoxis`. Sells `renoxis.activate`, `renoxis.agent.monthly` and files.

## Database

None pending.

## What changed, file by file

Each changed backend code file also starts with a one-line `Change note (Claude, Sep 2026)` comment saying the same thing.

| File | Change |
|---|---|
| `.env.example` | Added 14 key(s) the code reads that were missing: `WALLET_API_KEY`, `APIXIS_CLIENT_ID`, `APIXIS_WALLET_API_URL`, `APIXIS_REDIRECT_URI`, `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `PGHOST`, `PGPASSWORD`, `PGPORT`, `PGSERVICE`, `PGUSER`, `APIXIS_WALLET_API_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. |
| `docs/LAUNCH_NOTES.md` | This file. |

_Changes are backend and plumbing only. Pages, design and UI are not changed except where noted as a build or lint fix with no visual change._
