# Renoxis

Real-estate workspace with Cixy. Live: https://renoxis.vercel.app

Emerald command desk, account-scoped CRM, appointments, tasks, private documents, commission forecasts, FAQs and an animated/customizable assistant. One shared frontend serves `/` and `/dashboard`.

## Development

1. `npm ci`
2. Copy `.env.example` to `.env.local` and set the Supabase public URL/key. Never commit credentials.
3. `npm run dev` (or `npx next dev --hostname 127.0.0.1` in restricted runtimes).
4. Verify with `npm run lint`, `npx tsc --noEmit`, `node --experimental-strip-types --test tests/records.test.ts`, and `npm run build`.

The Renoxis Supabase schema has been provisioned. `supabase/schema.sql` and `supabase/ai_limits.sql` document it; do not blindly rerun policy creation on an existing database. Every customer record uses RLS. Provider refresh tokens are encrypted server-side and inaccessible to customer roles.

## Handoff

- [Launch status and verification](docs/LAUNCH_STATUS.md)
- [Provider connection setup](docs/CIXY_CONNECTIONS.md)
- [Cixy customization and Ixis catalog](docs/CIXY_CUSTOMIZATION.md)
- [App version and mobile handoff](docs/APP_VERSION.md)
- [Command desk behavior](docs/COMMAND_DESK.md)
- [Brokerage v1 team workspace](docs/BROKERAGE_V1.md)

Included customization tints the signature Cixy sprite and is free. Premium assets have no prices yet. Buy Ixis opens Apixis Wallet and does not unlock them here. Google requires the owner’s OAuth setup. No automated email/social outreach, wallet charges or cross-company customer sharing is enabled.
