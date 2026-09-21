# Renoxis brokerage v1 — team workspace

**Status:** Spec locked 2026-09-21. Docs greenlit. **Do not implement** until Awad or Dashboard Lead says “start build.”

**Product:** https://renoxis.vercel.app · Repo: `313aidaroos/Renoxis.dev`

## Decision summary

| Decision | Lock |
|----------|------|
| Model | **Team workspace** (brokerage entity + member invites) |
| Roles | `owner` / `broker` / `agent` / `assistant` |
| Record scope | `brokerage_id` + optional `owner_agent_id` |
| Visibility | RLS: peers do not see private notes unless shared |
| Rollups | Broker/owner see firm rollups; agents see their book |
| Cixy | Signed-in context; firm-level Qs for owners/brokers |
| Ixis billing | **Firm / office wallet pays** — agents use tools; brokerage balance is debited |
| Action prices | Property lookup **25** · Track contact **0** · Email **50** · Offer letter **100** |
| Close | **5% (500 bps)** Apixis platform cut on closed deal fees (`platform_commission` pending) |
| Real outbound | **Awad Approve** only — drafts OK; no silent send |
| Wallet capture | Hub-deferred (Developer Bot) until server contracts |

## UI theme (hard rule)

Brokerage v1 UI must match the live Renoxis website theme **to a tee**.

- Reuse emerald CommandDesk, `components/command-desk.css`, and the existing Cixy office/avatar surfaces.
- No new visual system, no alternate design language, no restyle of Apixis marketing sites.
- Team invites, rollups, firm Ixis balance, and private notes are new *flows* inside the same desk chrome — not a separate app shell.

## Out of v1

- Multi-office hierarchies
- MLS seats
- Full transaction-coordinator OS
- Auto commission-split ledgers between agents

## Domain model (plan)

### Entities

1. **`brokerages`** — id, name, slug, created_by, status, settings JSON
2. **`brokerage_members`** — brokerage_id, user_id, role (`owner`|`broker`|`agent`|`assistant`), status (`invited`|`active`|`removed`), invited_by, invited_at, joined_at
3. **`brokerage_invites`** — token, email, role, expires_at, accepted_at (or fold into members)
4. **CRM records** (existing `renoxis_records` shape) — add `brokerage_id` (required for team mode), `owner_agent_id` (nullable = firm-owned), `visibility` / private-notes channel
5. **Private notes** — either note rows with `shared=false` visible only to author (+ owner/broker override TBD) or a `renoxis_notes` table with RLS
6. **Ixis ledger (firm)** — `brokerage_id`, sku, amount_ixis, actor_user_id, ref (record/deal/draft id), created_at — **balance lives on brokerage**, not per agent in v1
7. **`platform_commission`** — pending rows on closed deals: bps=500, fee base, status (`pending`|`invoiced`|`paid`), no wallet auto-capture in v1

### RLS sketch

- Member of brokerage ⇒ can read non-private firm records in that brokerage
- `owner_agent_id = auth.uid()` ⇒ agent’s book
- Private notes: author only unless `shared_with` / broker role grant
- Service role for ledger writes from authenticated API after debit checks
- Never expose other brokerages

### API / product surfaces (v1)

- Create / rename brokerage (owner)
- Invite by email + role; accept invite
- Switch context: personal vs brokerage (if personal remains) — **default path: signed-in user acts inside active brokerage**
- CRM list/filter: my book vs team (role-gated)
- Cixy: workspace snapshot scoped to brokerage + role; firm questions for owner/broker
- Debit firm Ixis on lookup / email draft / offer draft; reject with clear UX if balance insufficient
- Send email / offer: create draft + **Approve** gate; no provider send without Approve + hub mail scopes

### SKUs (align with Cixy capability PR)

| SKU | Ixis | Notes |
|-----|------|--------|
| `property_lookup` | 25 | Firm wallet |
| `track_contact` | 0 | Free |
| `email_draft` | 50 | Firm wallet; send Approve-gated |
| `offer_letter` | 100 | Firm wallet; send Approve-gated |

## UX notes (pricing / team)

- Show firm Ixis balance to owner/broker; agents see “billed to office” not a personal balance
- Before costly Cixy actions, confirm SKU cost against firm balance
- Commission forecast / close flow: surface 5% platform cut as pending, not collected until hub wallet exists

## Implementation order (when “start build”)

1. Schema migration + RLS policies on Supabase `renoxis` (`loyjbfqpanskcecvpolt`)
2. Invite + membership APIs
3. Scope existing CRM APIs to `brokerage_id`
4. Firm Ixis ledger + SKU debit helpers (no Stripe/wallet capture)
5. Cixy/tool routes: debit + Approve hooks for send
6. Desk UX: team switcher, invites, private notes, balance
7. Secrets / Google send scopes only via Developer Bot hub after Approve

## Non-goals reminder

Do not restyle Apixis marketing sites. Do not enable Wallet/Stripe/MLS/send-mail until server contracts exist. Honest empty states — no fake DEMO deals.

## Owners

- Product / UX: Renoxis Lead
- Schema + env secrets: Developer Bot hub
- Coordinating CloudAgents: Dashboard Lead / Renoxis Lead after **start build**
