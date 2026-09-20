# Cixy customization and Ixis catalog

Product direction: Cixy is one recognizable assistant across Apixis companies, with company-specific workspaces. Renoxis uses an emerald real-estate office. This release includes basic customization; Awad sets prices and chooses tomorrow's premium assets.

## Included today: 0 Ixis

- Signature artwork, derived from the approved female green-blazer design: smile, wave, sleep, snack and coffee states, each with two animation frames. This is an illustrated sprite animation, not a generated video.
- Illustrated avatar mode: live skin, hair, iris and blazer colors; updo, long and short hair; morning, afternoon and evening office palettes.
- Manual activities, automatic activity cycling, motion switch, reduced-motion support, local save and reset.
- Color controls explicitly switch to the editable illustration. The signature raster artwork cannot be selectively recolored by these controls.
- Preferences are stored on-device under the signed-in account name. Cross-device sync is not implemented.

## Authoritative catalog

`lib/renoxis/customization.ts` is the single source of truth consumed by the website. Do not duplicate product data in a second JSON file. Every premium item has `price: null` and `status: coming-soon`. A null price means unavailable, not free. Prices are integer Ixis once approved. No USD conversion or financial value is implied.

| Catalog ID | Collection | Assets to create | Ixis price |
|---|---|---|---|
| basics | Cixy Essentials | Current editable illustration and activity states | 0 — included |
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

Never mark premium items owned in localStorage, invent a balance, or enable a fake purchase button. The current site intentionally shows Coming soon.
