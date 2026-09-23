# Welcome page and guided tour

The homepage at `/` shows the welcome page for both signed-in and anonymous visitors. Signed-in users have an Open dashboard link. Explicit board, billing, invite and Google-return links still redirect signed-in users to the matching dashboard location. The dashboard has a prominent Cixy tour banner. The public `/tour` route is replayable from the dashboard FAQs.

Cixy uses the existing `CixyAvatar` and original `cixy-sprites.png`. No replacement character or SVG avatar is introduced. The welcome uses the existing emerald palette and desk styling.

The tour asks role, first priority, and independent/team preference. Priority changes the order while retaining all 25 stops. Role and team appear in the closing summary. Every board and dashboard panel has a Cixy explanation, question, answer reactions, and direct navigation. The sample search, lead stage selector, task checkbox and add-task form use React memory only: no API requests, real records, charges, sends, or local data persistence. Reloading resets the demo. No live AI service is needed for the scripted tour.

The visitor can go back, skip, restart, pause animation or use reduced motion. A native sign-in dialog preserves keyboard focus behavior. Signing in carries the selected priority board via the existing auth callback; explicit billing/invite/provider returns take precedence. No profile or customer-record changes are made from tour answers.

Validation: tour tests cover all board/utility destinations, all personalized orderings, and safe preservation of callback query parameters. Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build -- --webpack`.

Before release, visually verify desktop and narrow mobile layouts, all sample controls, back/next/restart/skip, keyboard and reduced-motion behavior, sign-in dialog, and real authenticated redirects. Browser verification was blocked in the implementation environment by an unavailable admin security-policy check; visual and authenticated end-to-end checks are not claimed.
