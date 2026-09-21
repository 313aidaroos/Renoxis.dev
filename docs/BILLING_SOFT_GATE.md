# Renoxis soft billing gate (launch)

Pricing lock (Awad 2026-09-21):

- **Activate** — $50 = 5,000 Ixis one-time (Apixis Wallet)
- **Keep running** — $50/mo = 5,000 Ixis/mo (Apixis Wallet)
- **Heavy Cixy** — office ledger: lookup 25 · email 50 · offer 100 Ixis; chat basics included in the seat
- **No Renoxis Stripe** — cash buy only on Wallet

## Soft launch behavior

1. Unsigned users stay in preview (sign-in CTA).
2. Signed users without activate see Activate + Buy Ixis CTAs; CRM writes and Cixy chat stay gated.
3. Activated with expired month see Keep running CTA.
4. Local entitlement flags live in `localStorage` (`renoxis-billing-v1:<email>`) until Wallet Lead ships `renoxis.activate` / `renoxis.seat.monthly` redeem + entitlement callback.
5. Soft-launch “Confirm” buttons mark flags on-device only — honest copy that redeem replaces them.

## Wallet return URLs

- Activate: `https://renoxis.vercel.app/?board=Connections&billing=activate`
- Renew: `https://renoxis.vercel.app/?board=Connections&billing=renew`

Both must stay on Wallet allowlist (same host as studio return).

## Hub / Wallet Lead still needed

- SKUs at 5,000 Ixis (catalog currently lists monthly at 30,000 — revise)
- Server redeem + entitlement provision API
- `WALLET_API_KEY` on Renoxis Vercel (via Developer Bot hub only)
