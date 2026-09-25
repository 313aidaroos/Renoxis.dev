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
| Auth story | Magic-link first (+ password tab may exist) |
| Activate | 5,000 Ixis one-time (Wallet) |
| Keep running | 5,000 Ixis / mo (Wallet) |
| Property lookup | **0 Ixis** (typed facts; no paid data source yet) |
| Email draft | 50 Ixis from the person’s shared Apixis Wallet |
| Offer letter | 100 Ixis from the person’s shared Apixis Wallet |
| Track contact | 0 Ixis |
| Platform cut | 5% (500 bps) pending on closed-deal fees |
| Ixis peg | 100 Ixis = $1; cash buy on Wallet; closed-loop |

In-app Cixy prompt (`lib/renoxis/cixy-prompts.ts`) and `IXIS_SKU` / ApixisWallet `lib/catalog.ts` must stay aligned with the hub pack. Prefer hub pack updates over inventing product-local prices.
