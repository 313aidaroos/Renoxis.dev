"use client";

import { useWalletState } from "@/lib/renoxis/use-wallet-balance";

/**
 * Header pill: the person's Apixis Wallet Ixis balance on every board. When the account is not
 * linked to an Apixis ID yet, a small "Link Apixis ID" link sits next to it (2026-09-28 Grok: was
 * "Sign in with Apixis", which read as a sign-in prompt to people who are already signed in).
 */
export function WalletPill({ href, next = "/dashboard" }: { href: string; next?: string }) {
  const wallet = useWalletState();
  const signIn = `/auth/apixis/start?next=${encodeURIComponent(next)}`;
  return (
    <span className="wallet-pill-group">
      <a className="wallet-pill" href={href} title="Your Apixis Wallet balance · Buy Ixis" aria-label={`Apixis Wallet: ${wallet.available === null ? "balance unavailable" : wallet.available.toLocaleString() + " Ixis"}`}>
        <span aria-hidden="true">✦</span>
        {wallet.available === null ? "—" : wallet.available.toLocaleString()} Ixis
      </a>
      {wallet.loaded && !wallet.linked && (
        <a className="wallet-pill-link" href={signIn} title="Link your Apixis ID to use your Apixis Wallet balance here">
          Link Apixis ID
        </a>
      )}
    </span>
  );
}
