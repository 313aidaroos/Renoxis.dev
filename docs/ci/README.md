# Continuous integration setup

`seat-payments.yml` is ready to install at `.github/workflows/ci.yml`. The current GitHub OAuth token has no `workflow` scope, so GitHub rejected publishing it there. Until workflow access is granted, run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm run test:sql` (isolated local PostgreSQL only) before merging payment changes. Vercel continues to build PR deployments.
