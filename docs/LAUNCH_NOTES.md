# Renoxis: launch notes

_Updated 2026-09-25. One notes file per repo: what was changed, file by file, and everything you need to connect. The full family report: https://claude.ai/artifact/QERxA6PMsFK1vdR51Ex2NQ_

## Status

Ready after keys. No changes needed.

## Connect (in order)

1. **Apixis Wallet key.** In the ApixisWallet repo run `npm run family-keys` once. It prints one SQL block (paste it in the Wallet's Supabase SQL editor) and one env block per site. Paste this site's block: `WALLET_API_KEY`, `APIXIS_CLIENT_ID`, `APIXIS_WALLET_API_URL`.
2. Supabase and AI: see `.env.example`.

Every key this repo reads is listed in `.env.example` (required, optional, and legacy names to leave unset).

## OAuth apps

- **Google**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (see `.env.example` for the redirect).

## Apixis Wallet

App `renoxis`. Sells `renoxis.activate`, `renoxis.agent.monthly` and files.

## Database

None pending.

## What changed, file by file

| File | Change |
|---|---|
| `.env.example` | Added 3 key(s) the code reads that were missing: `WALLET_API_KEY`, `APIXIS_WALLET_API_URL`, `APIXIS_WALLET_API_KEY`. |
| `docs/LAUNCH_NOTES.md` | This file. |

_Changes are backend and plumbing only. Pages, design and UI are not changed except where noted as a build or lint fix with no visual change._
