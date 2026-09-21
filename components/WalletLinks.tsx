export function WalletLinks({ href }: { href: string }) {
  return (
    <div className="actions">
      <a className="primary" href={href}>
        Buy Ixis
      </a>
      <a className="soft-button" href={href}>
        Wallet
      </a>
    </div>
  );
}
