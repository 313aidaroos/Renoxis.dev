# Cixy shared brain (Renoxis apply)

Renoxis does **not** maintain a second brain. Knowledge comes from the Apixis hub store:

- Brief: `/home/box/agent-data/cixy-brain/briefs/YYYY-MM-DD.md`
- Packs: `packs/renoxis-wholesale-re.md`, `packs/wallet-ceo-operating.md`
- Pointer: `CURRENT.md`

## Applied 2026-09-23

| Lock | Value |
|------|--------|
| Audience | Agents, developers, brokerages |
| Origin | `https://renoxis.dev` |
| Auth story | "Log in with Apixis ID" first (Wallet SSO, one ID for every Apixis company); Renoxis email link + password tab also exist |
| Start fee | $50 · 5,000 Ixis one time (Wallet) |
| Monthly plan | $100 · 10,000 Ixis / month, renews every month. Wallet SKU `renoxis.agent.monthly` must be 10,000 |
| Property lookup | **25 Ixis**, billed to the office Wallet inside a brokerage |
| Email draft | 50 Ixis, office Wallet inside a brokerage |
| Offer letter | 100 Ixis, office Wallet inside a brokerage |
| Track contact | 0 Ixis |
| Platform cut | 5% (500 bps) pending on closed-deal fees |
| Ixis peg | 100 Ixis = $1; cash buy on Wallet; closed-loop |

In-app Cixy prompt (`lib/renoxis/cixy-prompts.ts`) and `IXIS_SKU` / ApixisWallet `lib/catalog.ts` must stay aligned with the hub pack. Prefer hub pack updates over inventing product-local prices.

## Applied 2026-09-27 (hub full refresh)

| Lock | Value |
|------|--------|
| Payments | Apixis Wallet only. No Renoxis Stripe, no Renoxis Ixis balance. Office ledger retired (PR #18). |
| Apixis Bank | 5% of every transaction in the Apixis universe, including agent-to-agent deals. Applied by Wallet / Apixis.dev. |
| World agent | Every signup gets their own Apixis world agent via Apixis ID (Wallet SSO). Entry `https://www.apixis.dev/enter?from=renoxis`. Cixy stays the guide. Arrivals get 1,000 in-world Ixis on Apixis.dev. |

Cixy should describe these accurately and never claim an agent was created or a fee was taken unless the product actually shows it.
