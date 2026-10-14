# Apixis Orbit — Renoxis.dev integration handoff

**Status: NOT CONNECTED**. This PR is a safe scoped implementation brief and capability manifest, with no production API or user behavior changed.

## What exists today
`README.md` documents account-scoped tasks, appointments, CRM, commission forecasts and Cixy; account data uses RLS. Google OAuth still needs owner setup, and automated email/social outreach is not enabled.

## Proposed scope
- Capability: `renoxis.tasks.read` (`read`, planned).
Provide the signed-in agent's upcoming real tasks and appointments with authorized source timestamps, no third-party communication.

## Concrete work to implement next
1. Re-use customer scope from existing Renoxis CRM/task APIs, not an email selector.
2. Return only owned task summaries and due dates; do not expose private documents.
3. Do not send or schedule emails automatically; future draft actions require separate approval.
4. Verify OAuth is connected before claiming calendar coverage.
5. Test tenant separation, stale calendars and empty tasks.

## Universal Orbit gates
1. The Orbit host uses the **existing Apixis identity** and wallet; this repo does not create another credit ledger, agent registry, checkout or auth provider.
2. Any future adapter needs a dedicated signed service credential, expiry + replay prevention, binding from Apixis ID subject to the **local account or tenant**, and per-resource authorization. The Orbit hub must not impersonate users by supplying emails.
3. Data must be genuine and have a source timestamp and `demo` flag; errors and absent integrations fail closed. User-facing text must distinguish draft, submitted, paid, and verified states.
4. Only read/draft initially. No autonomous outbound messaging, spending, contracts, orders, investments, publishing or settlement.
5. Require unit/integration tests for wrong owner, missing creds, no-data response, retried requests and source freshness.
6. Never activate an Orbit capability in Core until product-specific code, tests and owner production configuration are verified.

**This PR provides integration preparation only, not runtime wiring.** See https://github.com/313aidaroos/Apixis.dev/pull/86 for the draft Orbit Core.
