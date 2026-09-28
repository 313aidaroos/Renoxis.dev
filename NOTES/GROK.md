# NOTES/GROK.md

Grok Bot notes. Every change Grok Bot makes to this product gets a dated entry here so Claude, Hermes and Codex stay on the same page.

## 2026-09-27 (CT) — Apixis Wallet balance pill (PR #26, merge 58dee45)
- What: header pill on every Command Desk board shows the signed-in person's Apixis Wallet Ixis balance (links to Buy Ixis); a small "Sign in with Apixis" link shows when the account has no Apixis ID link. Balance refetches on focus / visibilitychange / pageshow, so it updates on return from Apixis Wallet.
- Where: `components/WalletPill.tsx` (new), `lib/renoxis/use-wallet-balance.ts` (`useWalletState`), `app/api/wallet/balance/route.ts` (adds `linked`), `components/CommandDesk.tsx` (pill in `.top-actions`), `components/command-desk.css` (pill styles).
- Not touched: Wallet code/env/keys, Stripe, checkout, payment links.
- Undo: `git revert -m 1 58dee4588c65c0030b41fa67a9c397b53fa351a6` (or revert PR #26 in GitHub).
