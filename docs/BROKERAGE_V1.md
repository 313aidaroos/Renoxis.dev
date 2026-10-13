# Renoxis team workspace

Implemented in the existing emerald CommandDesk. Roles: owner, broker, agent, assistant.

## Records and permissions

- Team records belong to a brokerage, optionally to an agent, with book/firm/private visibility.
- Owners and brokers see permitted office rollups; agents see their book and shared firm records.
- Private notes use role- and author-scoped access. Other brokerages must never be visible.
- Cixy receives a limited snapshot for the selected office and role, excluding private notes.
- Invites and saved drafts do not imply an email was sent.

## Billing

Ixis live in Apixis Wallet. A brokerage does not keep a second balance in Renoxis. The office Wallet is the owner's Apixis Wallet. When an agent in that brokerage uses a paid Cixy job, the charge uses the owner's Wallet, not the agent's.

| Action | Cost |
|---|---|
| Property lookup | 25 Ixis, office Wallet |
| Track contact | Free |
| Email draft | 50 Ixis, office Wallet |
| Offer-letter draft | 100 Ixis, office Wallet |

Paid jobs use Wallet SKUs `renoxis.property_lookup`, `renoxis.email_draft`, and `renoxis.offer_letter`, with reserve/capture. The Brokerage tab shows the office balance and links to Add Ixis the same way the rest of the app does. Owners and managers see the roster, each person's spend, and recent jobs. Agents see which brokerage they are in and that the office pays. Manual office grants stay retired (`/api/brokerage/grant` returns 410). `brokerages.ixis_balance` is not the office Wallet.

Closed-deal platform commission is recorded as a pending 5% (500 bps) fee. It is not automatically collected. Outbound email remains off; approval records review but does not send.

Buy Ixis opens Apixis Wallet with `product=renoxis` and an allowlisted `https://renoxis.dev` return. Buying Ixis does not unlock a premium outfit or grant a Renoxis seat by itself.

## Outside this release

MLS imports, multi-office hierarchies, automatic commission splits, live outbound mail, automatic monthly renewal, and premium wardrobe purchases are not enabled.
