# Renoxis command desk redesign

## What changed

Red/blue/white dashboard; fixed left navigation; one persistent Cixy office panel on desktop and a top-right chat control on every screen. Overview flows from command desk to supporting calendar/transaction/renovation panels without duplicating widgets. On smaller screens, the assistant office moves below the workspace; the top-right chat control remains available.

Every navigation control opens a dedicated board. Active Listings supports status filtering, search, property details, engagement metrics, property-specific leads and follow-up tasks. Existing authenticated Cixy chat, logout and listing generation routes are preserved. The existing homepage `/` displays the desk with explicitly labeled sample data and a magic-link sign-in dialog for guests. `/dashboard` remains authenticated. Both use a single shared CommandDesk component; no second website or preview route is shipped.

Cixy is an original lightweight animated CSS character, not the unprovided AWAD COMMAND asset. Customize blazer, hair, skin and three office backgrounds; save/load preferences on-device. System reduced motion disables animation.

## Honest integration boundaries

New CRM, email, calendar, transaction and analytics records are illustrative. Tasks and drafts live for the current visit. Email sending, social posting, wallet billing, document uploads and real renovation generation are NOT implemented by this UI change. No paid action is performed. Do not remove the sample banner until tenant-scoped persistence and verified provider integrations replace the data.

## QA

Run `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run build`. Open `/` for the public demo and `/dashboard` for authenticated access. Check every navigation board, search, status filters, property inquiries, task completion, calendar month/day selection, reply templates, renovation slider, social drafts, Cixy colors/backgrounds, save/load, dialog dismissal, keyboard navigation, mobile layout and reduced motion.

Existing Supabase/Anthropic configuration remains required for the authenticated features. This change does not alter keys, auth callback rules, RLS, billing prices or protected APIs.
