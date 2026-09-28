<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Apixis family (shared login + shared Wallet)
Read [`docs/APIXIS_FAMILY.md`](docs/APIXIS_FAMILY.md) before touching auth, Ixis or billing. One Ixis balance lives in Apixis Wallet; this site never keeps its own.

## AI change log (owner's standing rule)
Any AI model, bot, or agent that changes anything in this repo must append a dated entry to AI_CHANGELOG.md (what changed + why). No exceptions.
