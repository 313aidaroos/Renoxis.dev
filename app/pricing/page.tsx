import Link from "next/link";
import { FooterSocial } from "@/components/FooterSocial";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { payChoiceCopy, startFeeCopy } from "@/lib/renoxis/billing";
import {
  CARD_BILLING_COPY,
  IXIS_PER_USD,
  JOB_IXIS,
  START_FEE,
  beginCharge,
  closedDealFeeLabel,
  formatIxis,
  PROMO_END,
  getMonthlyPrice,
} from "@/lib/renoxis/pricing";
import { walletBuyUrl } from "@/lib/renoxis/wallet-link";
import { PricingCheckout } from "@/components/PricingCheckout";
import "@/components/welcome.css";

export async function generateMetadata() {
  await connection();
  const monthly = getMonthlyPrice();
  return { title: `Renoxis pricing — $${START_FEE.usd} to start, $${monthly.usd} a month` };
}

export default async function PricingPage() {
  await connection();
  let signedIn = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = !!user;
  }
  const start = signedIn ? "/dashboard?board=Connections&billing=activate" : "/login?next=%2Fdashboard%3Fboard%3DConnections%26billing%3Dactivate";
  const monthly = getMonthlyPrice();
  const later = getMonthlyPrice(PROMO_END);
  const begin = beginCharge();
  const buyHref = walletBuyUrl("https://renoxis.dev/pricing");

  return (
    <div className="welcome-shell">
      <header className="welcome-header">
        <Link className="welcome-brand" href="/"><span className="welcome-monogram">R</span><span>RENOXIS<small>A APIXIS COMPANY</small></span></Link>
        <nav><Link href="/tour">Tour with Cixy</Link><Link className="primary" href={start}>{signedIn ? "Open dashboard ↗" : "Sign in ↗"}</Link></nav>
      </header>

      <main className="welcome-main">
        <section className="welcome-hero">
          <span className="welcome-kicker">PRICING</span>
          <h1>A clear start.<br />A monthly plan.<br /><em>Nothing hidden.</em></h1>
          <p>Renoxis is the workspace for real estate agents, real estate developers and brokerages, with Cixy beside you: contacts, properties, deals, calendar and drafts in one desk. {payChoiceCopy()} Paid Ixis never expires.</p>
        </section>

        <section className="tour-price" aria-labelledby="price-title">
          <h2 id="price-title" className="welcome-small">What it costs</h2>
          <div><span>One-time start fee</span><strong>${START_FEE.usd} <small>· {formatIxis(START_FEE.ixis)} Ixis</small></strong></div>
          <div><span>Monthly plan</span><strong>${monthly.usd}/month <small>· {formatIxis(monthly.ixis)} Ixis</small></strong></div>
          <p>
            {startFeeCopy()} {monthly.phase === "promo"
              ? `Launch promo: $${monthly.usd}/month (${formatIxis(monthly.ixis)} Ixis) for the first month from launch, then $${later.usd}/month (${formatIxis(later.ixis)} Ixis).`
              : `The monthly plan is $${monthly.usd}/month (${formatIxis(monthly.ixis)} Ixis).`}
            {" "}The start fee and the first month are separate: ${begin.usd} / {formatIxis(begin.ixis)} Ixis to begin. The monthly plan renews automatically every month. {IXIS_PER_USD} Ixis = $1. Signing in is free and never charges you.
          </p>
        </section>

        <section className="welcome-how" id="checkout">
          <h2>How you pay</h2>
          <ul>
            <li>Pay with Ixis. After you sign in, Renoxis redeems the seat from Apixis Wallet. If the Wallet is short, Buy Ixis opens Apixis Wallet and brings you back.</li>
            <li>Pay by card: {CARD_BILLING_COPY}</li>
          </ul>
          <PricingCheckout startHref={start} buyHref={buyHref} renewHref={signedIn ? "/dashboard?board=Connections&billing=renew" : "/login?next=%2Fdashboard%3Fboard%3DConnections%26billing%3Drenew"} />
        </section>

        <section className="welcome-how">
          <h2>What the seat includes</h2>
          <ul>
            <li>Every board: Command Desk, Leads, Clients, Properties, Transactions, Calendar, Tasks, Documents, Analytics, Renovation Studio, Social Studio.</li>
            <li>Cixy chat and drafting on a limited snapshot of your own records.</li>
            <li>Team offices with owner, broker, agent and assistant roles.</li>
            <li>Your own Google inbox and calendar, read-only, once you connect your account.</li>
          </ul>
          <h2>What costs extra (your Apixis Wallet)</h2>
          <ul>
            <li>Email · {JOB_IXIS.email} Ixis. Offer letter · {JOB_IXIS.offerLetter} Ixis. Property lookup · {JOB_IXIS.propertyLookup} Ixis. In a brokerage, the office pays for these.</li>
            <li>Saving a contact is free. Apixis keeps {closedDealFeeLabel()} of a closed-deal fee.</li>
          </ul>
          <h2>What Renoxis does not do yet</h2>
          <ul>
            <li>Send email or publish posts for you — drafts are yours to review and send.</li>
            <li>Import MLS listings, look up property data, or generate renovation images.</li>
            <li>Charge a card for the subscription. Card billing is coming soon.</li>
          </ul>
        </section>

        <section className="welcome-actions">
          <Link className="primary" href={start}>Pay with Ixis · {formatIxis(START_FEE.ixis)} to start →</Link>
          <Link href="/tour">Take the tour first</Link>
          <a href={buyHref}>Buy Ixis</a>
        </section>
        <p className="tour-note">Ixis is a closed-loop platform credit for Apixis-family products. It is not a currency or investment and cannot be withdrawn.</p>
      </main>

      <footer className="welcome-footer">
        <span>RENOXIS <b>·</b> A Apixis Company <b>·</b> People. Properties. A brighter tomorrow.</span>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/tour">Tour with Cixy</Link><FooterSocial /></div>
      </footer>
    </div>
  );
}
