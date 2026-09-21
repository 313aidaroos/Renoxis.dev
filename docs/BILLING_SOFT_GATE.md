# Renoxis soft billing gate (launch)

Pricing lock (Awad 2026-09-21):

- **Activate** — $50 = 5,000 Ixis one-time (Apixis Wallet)
- **Keep running** — $50/mo = 5,000 Ixis/mo (Apixis Wallet)
- **Heavy Cixy** — office ledger: lookup 25 · email 50 · offer 100 Ixis; chat basics included in the seat
- **No Renoxis Stripe** — cash buy only on Wallet

## Locked Wallet SKUs (LIVE — ApixisWallet #5 → main)

| Key | Alias | Amount |
| --- | --- | --- |
| `renoxis.activate` | `renoxis-activate` | 5,000 Ixis one-time |
| `renoxis.agent.monthly` | `renoxis-monthly` | 5,000 Ixis/mo (30k row gone) |

Buy link stays `/buy?product=renoxis&return_url=…`.

Redeem flow: quote → reserve → capture. Idempotency:

- Activate: `renoxis-{userId}-activate`
- Monthly: `renoxis-{userId}-seat-{YYYY-MM}`

## Soft launch behavior

1. Unsigned users stay in preview (sign-in CTA).
2. Signed users without activate see Activate + Buy Ixis CTAs; CRM writes and Cixy chat stay gated.
3. Activated with expired month see Keep running CTA.
4. Local entitlement flags live in `localStorage` (`renoxis-billing-v1:<email>`) until redeem capture provisions a real entitlement.
5. **Catalog is live** — do not show “SKU pending.” Entitlements stay **empty until capture** (do not invent balances). Soft Confirm marks on-device flags only as a bridge.

## Wallet return URLs

- Activate: `https://renoxis.vercel.app/?board=Connections&billing=activate`
- Renew: `https://renoxis.vercel.app/?board=Connections&billing=renew`

Both must stay on Wallet allowlist (same host as studio return). `APP_URL=https://renoxis.vercel.app` on Renoxis Vercel (hub).

## Hub / Wallet Lead still needed

- Wire Renoxis server redeem (quote → reserve → capture) + entitlement provision
- `WALLET_API_KEY` on Renoxis Vercel (via Developer Bot hub only)
