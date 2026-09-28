"use client";

import { useWalletState } from "@/lib/renoxis/use-wallet-balance";

/**
 * Header pill: the person's Apixis Wallet Ixis balance on every board. When the account is not
 * linked to an Apixis ID yet, a small "Sign in with Apixis" link sits next to it.
 */
export function WalletPill({ href, next = "/dashboard" }: { href: string; next?: string }) {
  const wallet = useWalletState();
  const signIn = `/auth/apixis/start?next=${encodeURIComponent(next)}`;
  return (
    <span className="wallet-pill-group">
      <a className="wallet-pill" href={href} title="Your Apixis Wallet balance · Buy Ixis">
        <span aria-hidden="true">✦</span>
        {wallet.available === null ? "—" : wallet.available.toLocaleString()} Ixis
      </a>
      {wallet.loaded && !wallet.linked && (
        <a className="wallet-pill-link" href={signIn}>
          Sign in with Apixis
        </a>
      )}
    </span>
  );
}
