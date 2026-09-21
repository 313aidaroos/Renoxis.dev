# Cixy customization and Ixis catalog

Product direction: Cixy is one recognizable assistant across Apixis companies, with company-specific workspaces. Renoxis uses an emerald real-estate office. This release includes basic customization; Awad sets prices and chooses tomorrow's premium assets.

## Included today: 0 Ixis

- Signature artwork only (`public/cixy-sprites.png`): smile, wave, sleep, snack and coffee states, each with two animation frames. This is the sprite sheet, not a generated video and not an SVG person.
- Essentials tint that same painting: skin, hair, iris and blazer colors; updo, long and short hair color coverage; morning, afternoon and evening office palettes. There is no second character.
- Hair style colors the painted hair. It does not draw a new cut. A true wardrobe silhouette needs layered raster assets.
- Manual activities, automatic activity cycling, motion switch, reduced-motion support, local save and reset.
- Preferences are stored on-device under the signed-in account name. A saved `style: "illustrated"` still loads and renders on the signature sprite. Cross-device sync is not implemented.

## Authoritative catalog

`lib/renoxis/customization.ts` is the single source of truth consumed by the website. Do not duplicate product data in a second JSON file. Every premium item has `price: null` and `status: coming-soon`. A null price means unavailable, not free. Prices are integer Ixis once approved. No USD conversion or financial value is implied.

| Catalog ID | Collection | Assets to create | Ixis price |
|---|---|---|---|
| basics | Cixy Essentials | Signature sprite tints and activity states | 0 — included |
| outfits-professional | The Professional Collection | Tailored suits, modest coordinated sets, brokerage looks | Owner to set |
| outfits-casual | Off-Duty Cixy | Sweaters, casual layers, weekend looks | Owner to set |
| office-city | City View Office | Detroit skyline, modern broker office, executive desk | Owner to set |
| office-garden | Garden Studio | Sunlit studio, plants, warm materials | Owner to set |
| backgrounds | Around the World | Regional skylines, seasonal scenes, color themes | Owner to set |
| accessories | The Finishing Touch | Glasses, jewelry, desk accents, coffee mugs | Owner to set |
| animation-packs | A Little More Personality | Thinking, typing, celebrating, greetings, reading | Owner to set |

## Premium asset specification

Keep consistent character proportions, face and lighting. Deliver named transparent layers for hair, skin, eyes, outfit and accessories if the premium character must remain recolorable. Separate office backgrounds from the character. Include idle/wave/sleep/snack/coffee compatibility, motion-reduced stills, mobile crops, ownership/licensing records and an asset manifest. Avoid baking app text, money, metrics or user names into artwork.

## Checkout to implement after approval

1. Server reads item ID and approved integer price from the authoritative catalog; never trust browser prices.
2. Authenticate the customer and map their Renoxis account to their Apixis wallet with an explicit, signed identity exchange.
3. Request a server-side quote, then reserve points with an idempotency key.
4. Atomically grant one entitlement per user/item and capture the reservation. On failure release it. Retry safely; verify wallet webhook signatures and replay protection.
5. Provide purchase history, owned-item filtering, balance from the wallet API, insufficient-points errors and refund/revocation handling.
6. Enable checkout only after wallet sandbox integration and concurrent-purchase tests pass.

Never mark premium items owned in localStorage, invent a balance, or enable a fake purchase button. While `price` is null the card stays Coming soon. **Buy Ixis** opens `https://apixis-wallet.vercel.app/buy?product=renoxis&return_url=…` and returns to Cixy Studio. It does not unlock the collection on this device.

## Native Cixy operator prompts

Chat (`app/api/chat/route.ts`) and listing copy (`app/api/listings/generate/route.ts`) share `lib/renoxis/cixy-prompts.ts`. The assistant name remains Cixy. Native Cixy now includes senior-operator guidance for agents, investors, landlords, wholesalers, and developers, including how to sell or assign a wholesale contract: confirm an assignable interest, package only known facts, use an opted-in buyers list, give a disposition cadence the user sends themselves, paper the assignment fee and deposit through title, double-close with real funds when the contract is not assignable, and exit on the contract's actual rights.

Cixy separates facts, assumptions, and estimates, and names what a local attorney, broker, title company, lender, or PHA must verify. It does not invent comps, rents, statutes, payment standards, or guaranteed returns. It refuses steering and flags people-preference ad copy without inventing phrase bans such as "quiet" or "master bedroom." It refuses fraud, straw buyers, hiding a required disclosure, fake proof of funds, assigning a non-assignable contract, and unlicensed brokerage advice stated as if it were legal everywhere. These prompts do not add wallet charges or live outreach. Auth, rate limits, and response shapes are unchanged. The model default remains `claude-sonnet-4-6` unless `ANTHROPIC_MODEL` is set.
