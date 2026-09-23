import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ACTIVATE_IXIS, MONTHLY_IXIS, ACTIVATE_USD, MONTHLY_USD } from "@/lib/renoxis/billing";
import "@/components/welcome.css";

export const metadata = { title: "Renoxis pricing — one activation, one monthly seat, paid in Ixis" };

const fmt = (n: number) => n.toLocaleString("en-US");

export default async function PricingPage() {
  let signedIn = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = !!user;
  }
  const start = signedIn ? "/dashboard?board=Connections&billing=activate" : "/?board=Connections&billing=activate";

  return (
    <div className="welcome-shell">
      <header className="welcome-header">
        <Link className="welcome-brand" href="/"><span className="welcome-monogram">R</span><span>RENOXIS<small>AN APIXIS COMPANY</small></span></Link>
        <nav><Link href="/tour">Tour with Cixy</Link><Link className="primary" href={start}>{signedIn ? "Open dashboard ↗" : "Sign in ↗"}</Link></nav>
      </header>

      <main className="welcome-main">
        <section className="welcome-hero">
          <span className="welcome-kicker">PRICING · PAID IN IXIS</span>
          <h1>One activation.<br />One monthly seat.<br /><em>Nothing hidden.</em></h1>
          <p>Renoxis is the real-estate agent&rsquo;s workspace with Cixy beside you: contacts, properties, deals, calendar and drafts in one desk. You pay with Ixis — the Apixis family credit — through Apixis Wallet. 100 Ixis = $1. Paid Ixis never expires.</p>
        </section>

        <section className="tour-price" aria-labelledby="price-title">
          <h2 id="price-title" className="welcome-small">What it costs</h2>
          <div><span>One-time activation</span><strong>${ACTIVATE_USD} <small>· {fmt(ACTIVATE_IXIS)} Ixis</small></strong></div>
          <div><span>Monthly seat</span><strong>${MONTHLY_USD}/month <small>· {fmt(MONTHLY_IXIS)} Ixis</small></strong></div>
          <p>Activation and the first month are separate: ${ACTIVATE_USD + MONTHLY_USD} / {fmt(ACTIVATE_IXIS + MONTHLY_IXIS)} Ixis to begin. Your seat runs 30 days from each renewal. Signing in is free and never charges you.</p>
        </section>

        <section className="welcome-how">
          <h2>What the seat includes</h2>
          <ul>
            <li>Every board: Command Desk, Leads, Clients, Properties, Transactions, Calendar, Tasks, Documents, Analytics, Renovation Studio, Social Studio.</li>
            <li>Cixy chat and drafting on a limited snapshot of your own records.</li>
            <li>Team offices with owner, broker, agent and assistant roles.</li>
            <li>Your own Google inbox and calendar, read-only, once you connect your account.</li>
          </ul>
          <h2>What costs extra (office ledger)</h2>
          <ul>
            <li>Email draft · 50 Ixis. Offer letter draft · 100 Ixis. Debited from the office, not your wallet.</li>
            <li>Saving a property or tracking a contact is free.</li>
          </ul>
          <h2>What Renoxis does not do yet</h2>
          <ul>
            <li>Send email or publish posts for you — drafts are yours to review and send.</li>
            <li>Import MLS listings, look up property data, or generate renovation images.</li>
          </ul>
        </section>

        <section className="welcome-actions">
          <Link className="primary" href={start}>Start · {fmt(ACTIVATE_IXIS)} Ixis →</Link>
          <Link href="/tour">Take the tour first</Link>
          <a href="https://apixis-wallet.vercel.app/buy?product=renoxis&return_url=https%3A%2F%2Frenoxis.vercel.app%2Fpricing">Buy Ixis</a>
        </section>
        <p className="tour-note">Ixis is a closed-loop platform credit for Apixis-family products. It is not a currency or investment and cannot be withdrawn.</p>
      </main>

      <footer className="welcome-footer">
        <span>RENOXIS <b>·</b> People. Properties. A brighter tomorrow.</span>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/tour">Tour with Cixy</Link></div>
      </footer>
    </div>
  );
}
