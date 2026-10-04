import Link from "next/link";
import { RenoxisFeed } from "./RenoxisFeed";
import "@/components/command-desk.css";
import "@/components/welcome.css";
import "./feed.css";

export const metadata = { title: "Feed · Renoxis", description: "Posts from every Apixis company, in one feed." };

export default function FeedPage() {
  return (
    <div className="renoxis welcome-shell">
      <a className="skip-link" href="#feed-main">Skip to content</a>
      <header className="welcome-header">
        <Link href="/" className="welcome-brand" aria-label="Renoxis home"><span className="welcome-monogram">R</span><span>RENOXIS<small>A APIXIS COMPANY</small></span></Link>
        <nav aria-label="Welcome navigation">
          <Link href="/tour">Explore with Cixy</Link>
          <Link href="/companies">Apixis Companies</Link>
          <Link href="/feed" aria-current="page">Feed</Link>
          <Link className="primary" href="/dashboard">Open dashboard <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>
      <main id="feed-main" className="welcome-main rx-feed-main">
        <div className="rx-feed-head">
          <span className="welcome-kicker"><i /> SOCIXIS SOCIAL · EVERY APIXIS COMPANY</span>
          <h1>Feed. <em>What everyone’s sharing.</em></h1>
        </div>
        <RenoxisFeed />
      </main>
      <footer className="welcome-footer"><span>RENOXIS <b>·</b> A Apixis Company <b>·</b> People. Properties. A brighter tomorrow.</span><div><Link href="/pricing">Pricing</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/tour">Tour with Cixy</Link></div></footer>
    </div>
  );
}
