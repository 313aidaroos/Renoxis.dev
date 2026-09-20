# Renoxis app version

The app uses this repository and the existing Next.js routes. Do not create a second frontend, copied dashboard, or independent customer database.

## Available now

- Responsive web app with native mobile navigation, `app/manifest.ts`, icons and standalone display.
- iPhone/iPad: Safari → Share → Add to Home Screen. Android/desktop: browser Install app option when available.
- Same Supabase authentication, account-scoped records and private files as the website.
- Network-only service worker with a simple offline screen. Never cache auth responses, private data or provider tokens.
- Cixy animation obeys reduced-motion settings. Included appearance controls persist on-device under a versioned, account-scoped key.

## Native wrapper handoff

If App Store/Google Play distribution is needed, keep the web app as the shared product and use a thin Capacitor wrapper or a separate Expo client consuming `/api/records` only after implementing mobile bearer-token auth. Current APIs use secure cookie sessions, so do not assume a native client can call them unauthenticated. Do not embed a service role key, OAuth client secret, or Anthropic key in any app bundle.

Before store submission: configure universal/app links and explicit auth callbacks; test external OAuth round trips; add native secure token storage, camera/file permissions, keyboard and safe-area handling, account deletion/export, privacy disclosures and release signing. Push notifications and offline record editing are future work, not implemented features.

Premium avatar checkout must comply with the applicable store payment rules. No wallet debit is enabled in this release. Share the same catalog IDs and entitlements rather than creating a separate catalog per platform.
