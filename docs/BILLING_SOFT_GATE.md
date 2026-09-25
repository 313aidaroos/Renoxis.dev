# Renoxis billing

Renoxis uses one personal Apixis Wallet. It does not keep an office balance or run Stripe Checkout.

- Activation: 5,000 Ixis ($50), one time, SKU `renoxis.activate`.
- Monthly access: 5,000 Ixis ($50), SKU `renoxis.agent.monthly`. Each purchase adds 30 days; it is not automatic renewal.
- Activation and the first month are separate purchases: 10,000 Ixis ($100) to start.
- Email draft: 50 Ixis, SKU `renoxis.email_draft`. Offer-letter draft: 100 Ixis, SKU `renoxis.offer_letter`.
- Saving typed property facts and tracking contacts are free. There is no property-data lookup provider.
- The person choosing a paid action pays from their shared Wallet. Office membership organizes records and drafts; it does not change who pays.

The Wallet catalog is the price authority. Renoxis uses the shared reserve → provision → capture SDK. Server-only entitlements gate paid workspace writes and AI. Browser state cannot grant access. Trusted beta grants remain server environment settings.

Buy Ixis opens Wallet `/buy?product=renoxis&return_url=…`. Canonical return origin: `https://renoxis.dev`. Buying Ixis credits the Wallet; activation and monthly access require separate redemption. Returning from checkout alone never unlocks access.

`/api/brokerage/grant` returns 410. Legacy office-ledger tables remain for historical records only and are not used by paid actions. Live email sending is disabled, even for approved drafts.
