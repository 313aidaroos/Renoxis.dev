import Link from "next/link";
import { FooterSocial } from "./FooterSocial";
import type { ReactNode } from "react";
import "./command-desk.css";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="renoxis legal-page">
      <a className="skip-link" href="#legal-content">
        Skip to content
      </a>
      <header className="legal-bar">
        <Link className="brand" href="/">
          <img className="brand-mark" src="/brand/icon-192.png" alt="" width={56} height={56} />
          <span>
            <strong>RENOXIS</strong>
            <small>People. Properties. A brighter tomorrow.</small>
          </span>
        </Link>
        <p>A Apixis Company</p>
        <Link href="/">Back to workspace</Link>
      </header>
      <main id="legal-content">
        <article className="desk-panel legal-doc">
          <span className="eyebrow">CLOSED BETA</span>
          <h1>{title}</h1>
          <p className="muted">Last updated September 21, 2026</p>
          {children}
        </article>
      </main>
      <footer>
        <span>
          RENOXIS <b>·</b> A Apixis Company
        </span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/">Home</Link>
          <FooterSocial />
        </div>
      </footer>
    </div>
  );
}
