# Renoxis team workspace

Implemented in the existing emerald CommandDesk. Roles: owner, broker, agent, assistant.

## Records and permissions

- Team records belong to a brokerage, optionally to an agent, with book/firm/private visibility.
- Owners and brokers see permitted office rollups; agents see their book and shared firm records.
- Private notes use role- and author-scoped access. Other brokerages must never be visible.
- Cixy receives a limited snapshot for the selected office and role, excluding private notes.
- Invites and saved drafts do not imply an email was sent.

## Billing after shared Wallet rollout

There is one Ixis balance, in the person’s Apixis Wallet. The person clicking a paid action pays; the office is not billed.

| Action | Cost |
|---|---|
| Save typed property facts | Free; no external lookup |
| Track contact | Free |
| Email draft | 50 Ixis from personal Apixis Wallet |
| Offer-letter draft | 100 Ixis from personal Apixis Wallet |

Paid drafts use Wallet SKUs `renoxis.email_draft` and `renoxis.offer_letter`, with reserve/capture and stable attempt references. Manual office grants are retired (`/api/brokerage/grant` returns 410). Legacy SQL ledger objects remain historical and are not the billing authority.

Closed-deal platform commission is recorded as a pending 5% (500 bps) fee. It is not automatically collected. Outbound email remains off; approval records review but does not send.

Buy Ixis opens Apixis Wallet with `product=renoxis` and an allowlisted `https://renoxis.dev` return. Buying Ixis does not unlock a premium outfit or grant a Renoxis seat by itself.

## Outside this release

MLS imports, multi-office hierarchies, automatic commission splits, live outbound mail, automatic monthly renewal, and premium wardrobe purchases are not enabled.
