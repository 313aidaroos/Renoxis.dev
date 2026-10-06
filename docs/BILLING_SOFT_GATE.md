# Renoxis billing

Renoxis does not keep its own Ixis balance and does not run card checkout. Ixis live in Apixis Wallet. The plan can be paid by card or with Ixis. Card checkout is not built on this site.

- Start fee: 5,000 Ixis ($50), one time, SKU `renoxis.activate`.
- Monthly plan: 10,000 Ixis ($100), SKU `renoxis.agent.monthly`. It renews every month. The Wallet catalog must be updated to 10,000. This repo does not change Apixis Wallet.
- The start fee and the first month are separate: 15,000 Ixis ($150) to begin.
- Email draft: 50 Ixis. Offer letter: 100 Ixis. Property lookup: 25 Ixis.
- Saving a contact is free.
- Inside a brokerage, those Cixy jobs are paid from the office Wallet (the owner's Apixis Wallet), not from the agent who clicked. Someone with no brokerage still pays from their own Wallet.
- Apixis keeps 5% of a closed-deal fee. It is recorded as pending.

The Wallet catalog is the price authority. Renoxis uses the shared reserve → provision → capture SDK. Server-only entitlements gate paid workspace writes and AI. Browser state cannot grant access. Trusted beta grants remain server environment settings.

Buy Ixis opens Wallet `/buy?product=renoxis&return_url=…`. Canonical return origin: `https://renoxis.dev`. Buying Ixis credits the Wallet; activation and monthly access require separate redemption. Returning from checkout alone never unlocks access.

`/api/brokerage/grant` returns 410. Legacy office-ledger tables remain for historical records only and are not used by paid actions. Live email sending is disabled, even for approved drafts.
