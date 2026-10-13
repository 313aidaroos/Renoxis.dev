# Renoxis billing

Renoxis does not keep its own Ixis balance and does not run card checkout. Ixis live in Apixis Wallet. The customer picks card or Ixis. Card subscription billing shows Coming soon. This repo has no Stripe code. Amounts live in `lib/renoxis/pricing.ts`.

- Start fee: 5,000 Ixis ($50), one time, SKU `renoxis.activate`.
- Monthly plan: $50 / 5,000 Ixis (`renoxis.agent.monthly`, which exists today) from launch on 2027-01-01 midnight Central until 2027-02-01, then $100 / 10,000 Ixis on `renoxis.agent.monthly.10000` (Wallet Lead is publishing that id). It renews every month. `getMonthlyPrice(now)` switches it. This repo does not change Apixis Wallet.
- The start fee and the first month are separate. During the promo that is 10,000 Ixis ($100) to begin. After the promo it is 15,000 Ixis ($150).
- Email draft: 50 Ixis. Offer letter: 100 Ixis. Property lookup: 25 Ixis.
- Saving a contact is free.
- Inside a brokerage, those Cixy jobs are paid from the office Wallet (the owner's Apixis Wallet), not from the agent who clicked. Someone with no brokerage still pays from their own Wallet.
- Apixis keeps 5% of a closed-deal fee. It is recorded as pending.

The Wallet catalog is the price authority. Renoxis uses the shared reserve → provision → capture SDK. Server-only entitlements gate paid workspace writes and AI. Browser state cannot grant access. Trusted beta grants remain server environment settings.

Buy Ixis opens Wallet `/buy?product=renoxis&return_url=…`. Canonical return origin: `https://renoxis.dev`. Buying Ixis credits the Wallet; activation and monthly access require separate redemption. Returning from checkout alone never unlocks access.

`/api/brokerage/grant` returns 410. Legacy office-ledger tables remain for historical records only and are not used by paid actions. Live email sending is disabled, even for approved drafts.
