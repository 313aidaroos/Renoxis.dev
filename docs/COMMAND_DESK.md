# Renoxis command desk

The existing `components/CommandDesk.tsx` now drives both `/` and authenticated `/dashboard`. No duplicate site or replacement repository was created. Design follows the approved emerald sidebar, pale workspace, central female Cixy office, supporting tiles and bottom pipeline/commission strip.

All navigation tabs lead to purposeful boards: email, calendar/tasks, leads, clients, properties, transactions, renovation briefs, social drafts, document links/uploads, analytics, Cixy Studio, Connections and FAQs. New/edit/delete actions persist through the authenticated API. Follow-up actions create saved tasks and never imply a sent message. External provider features expose configuration or connection errors honestly.

No customer is seeded with example properties, fake leads, a fixed Closed 12 or $184,500 commission. Commission forecasts derive from saved transaction entries and remain estimates. Property art is a generic illustration, not an actual listing photograph. Search filters board records. Core customer data is never cached offline.

Quality gates: lint, TypeScript, production build, account-isolation tests, authenticated CRUD/conflict tests, document authorization, unauthenticated API checks, desktop/mobile interaction checks and deployment health. See `LAUNCH_STATUS.md` for actual results and limitations.
