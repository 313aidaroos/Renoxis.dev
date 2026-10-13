# Pricing — Renoxis

**Date:** 2026-10-13  
**Status:** Locked by Awad  
**Code:** `lib/renoxis/pricing.ts` (pages, copy, and server charges read this file)

## Shared terms (all Apixis-family products)
- All paid plans renew monthly automatically.
- Customers pay by card OR with Ixis (100 Ixis = $1).
- Signups via Apixis ID get 1,000 Ixis and an agent sent into Apixis. That grant lives in the shared Wallet. Renoxis does not grant it.
- The shared Apixis Stripe account sells Ixis packs today. Renoxis does not add Stripe keys or Stripe code. Card subscription billing on this site shows **Coming soon**.

## Renoxis pricing
- $50 one-time start fee (5,000 Ixis). Wallet SKU `renoxis.activate` (exists today).
- Launch promo: $50/month (5,000 Ixis) for the first month from launch day, then $100/month (10,000 Ixis), renewing monthly.
- Launch day is 2027-01-01 at midnight Central (`2027-01-01T06:00:00.000Z`). Awad set this on 2026-10-13.
- The switch is automatic: `PROMO_END = LAUNCH_DATE + 1 calendar month` (`2027-02-01T06:00:00.000Z`), and `getMonthlyPrice(now)` picks the phase. Dates before launch still quote the launch rate. The $100/month price starts 2027-02-01.
- Promo monthly SKU: `renoxis.agent.monthly` (exists today at 5,000 Ixis).
- The 10,000 Ixis monthly SKU id is `renoxis.agent.monthly.10000`. Wallet Lead is publishing that id. Do not point it at `renoxis.agent.monthly`.
- Extra Cixy jobs: email 50 Ixis, offer letter 100 Ixis, property lookup 25 Ixis. Saving a contact is free.
- Brokerage: the office wallet pays for its agents' Cixy jobs. Apixis takes 5% of closed-deal fees (recorded as pending).

## Not done here
- Do not apply `supabase/migrations/20261006120000_brokerage_office_wallet.sql` to the live database until Awad says so.
- Do not merge or deploy this to production until Awad approves.
