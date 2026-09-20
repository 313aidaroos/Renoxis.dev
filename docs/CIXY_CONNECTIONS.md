# Cixy connections: implementation boundary

The live UI includes a five-step setup planner: work email, calendar review preferences, public HTTPS listing links, real-estate specialty/brokerage/paid tools, and a connection checklist. Values are React state for the current mounted session, not permanently saved; leaving the Connections board resets them. No provider is represented as connected.

The authenticated chat prompt covers low-cash strategies, Section 8 research, wholesaling, underwriting, brokerage systems and responsible licensed skip tracing. A system prompt is not proof of expertise, retrieval, tools or professional certification. Current jurisdiction-specific information requires verified sources. No live chat/provider test has been performed in this change.

## Required before real data can populate tiles

1. Register Renoxis-owned Google and/or Microsoft OAuth apps. Obtain approved least-privilege inbox-read and calendar scopes and production redirect URLs. Use state, PKCE, token rotation and revocation. Never ask customers for inbox passwords.
2. Add tenant-scoped profiles, provider connections, listing sources, pending event proposals, events and audit records. Use authenticated server endpoints and database RLS; validate user ownership on every read/write. Encrypt provider refresh tokens server-side; never send them to the browser or language model.
3. Persist onboarding progress per user. Show connection status from server verification, not local checkbox state. Provide disconnect and deletion controls and a clear retention policy.
4. Ingest only user-authorized messages. Treat emails and listing pages as untrusted. Extract structured proposed events with source message ID, property, timezone, start/end, participants and confidence. Flag ambiguity, cancellations and changes; do not guess missing dates.
5. Require review before calendar writes. Apply idempotency per user/message/event, conflict checks, timezone/DST validation, consented attendee invitations, retries and audit logging. Do not mark success until the calendar provider confirms an event ID.
6. Import listing links only through approved APIs or permitted public access. Guard SSRF: reject credentials, private/local IP ranges and unsafe redirects; restrict fetch size/time; respect MLS licensing and brokerage permissions. Label stale/missing data. Never import sample listings into customer records.
7. Ask which brokerage CRM, MLS, research and skip-tracing subscriptions the customer owns. Verify each provider's API, licensing, allowed purpose, fees and applicable rules. Obtain approval before paid lookups; do not claim universal interoperability. Separate property-owner outreach from tenant screening, enforce suppression/opt-outs and retention controls.
8. Replace sample tiles with authorized provider data and empty/loading/error states. Test with separate tenants, OAuth denial/expiry, revoked access, duplicated emails, ambiguous dates, failed writes and disconnection. No automated paid action or outreach without explicit consent.

Do not turn a user's personal ChatGPT Gmail/Calendar connection into a shared SaaS integration. Every Renoxis customer needs their own authorized connection to the Renoxis application.
