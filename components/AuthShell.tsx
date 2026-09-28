// 2026-09-28 Grok Developer Bot: shared shell for /login, /set-password and /auth/error with the
// same header, fonts and colours as the Renoxis home page, plus the Cixy sign-in help card.
import Link from "next/link";
import { CixyHelp } from "./CixyHelp";
import "./command-desk.css";
import "./welcome.css";
import "./auth.css";

export function AuthShell({ children, help = true }: { children: React.ReactNode; help?: boolean }) {
  return (
    <div className="renoxis welcome-shell auth-shell">
      <a className="skip-link" href="#auth-main">Skip to content</a>
      <header className="welcome-header">
        <Link href="/" className="welcome-brand" aria-label="Renoxis home">
          <span className="welcome-monogram">R</span>
          <span>RENOXIS<small>A APIXIS COMPANY</small></span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/tour">Explore with Cixy</Link>
          <Link href="/pricing">Pricing</Link>
          <Link className="soft-button auth-home-link" href="/">Home</Link>
        </nav>
      </header>
      <main id="auth-main" className={help ? "auth-main" : "auth-main auth-main-single"}>
        <div className="auth-card">{children}</div>
        {help && <CixyHelp />}
      </main>
      <footer className="welcome-footer">
        <span>RENOXIS <b>·</b> A Apixis Company <b>·</b> People. Properties. A brighter tomorrow.</span>
        <div>
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/tour">Tour with Cixy</Link>
        </div>
      </footer>
    </div>
  );
}
