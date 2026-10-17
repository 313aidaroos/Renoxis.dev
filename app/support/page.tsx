import Link from "next/link";
import { FooterSocial } from "@/components/FooterSocial";
import { OtherIxisCompanies } from "@/components/OtherIxisCompanies";
import { connection } from "next/server";
import "@/components/welcome.css";

export const metadata = {
  title: "Support — Renoxis",
  description: "Get help with your Renoxis workspace.",
};

export default async function SupportPage() {
  await connection();

  return (
    <div className="welcome-shell">
      <header className="welcome-header">
        <Link className="welcome-brand" href="/">
          <img className="welcome-monogram" src="/brand/icon-192.png" alt="" width={48} height={48} />
          <span>
            RENOXIS<small>A APIXIS COMPANY</small>
          </span>
        </Link>
        <nav>
          <Link href="/tour">Tour with Cixy</Link>
          <Link href="/pricing">Pricing</Link>
          <Link className="primary" href="/login">
            Sign in ↗
          </Link>
        </nav>
      </header>

      <main className="welcome-main">
        <section className="welcome-hero">
          <span className="welcome-kicker">SUPPORT</span>
          <h1>
            Need help?
            <br />
            <em>We are here.</em>
          </h1>
          <p>
            Whether you are getting started, troubleshooting an issue, or have a
            question about your workspace, reach out to the Renoxis team.
          </p>
        </section>

        <section className="welcome-how">
          <h2>Ways to get help</h2>
          <article>
            <h3>Email support</h3>
            <p>
              Send your question or issue to{" "}
              <a href="mailto:renoxis@apixis.dev">renoxis@apixis.dev</a>. We
              typically respond within one business day.
            </p>
          </article>

          <article>
            <h3>Cixy help</h3>
            <p>
              Once you are signed in, ask Cixy directly from your Command Desk.
              Cixy can help with workspace questions, walk you through features,
              and answer real estate workflow questions.
            </p>
          </article>

          <article>
            <h3>Tour & documentation</h3>
            <p>
              Not sure where to start? Take the{" "}
              <Link href="/tour">interactive tour with Cixy</Link> or check our{" "}
              <Link href="/pricing">pricing page</Link> for billing questions.
            </p>
          </article>
        </section>

        <section className="welcome-invitation">
          <div>
            <span className="welcome-kicker">COMMON QUESTIONS</span>
            <h2>Quick answers</h2>
            <dl>
              <dt>How do I sign up?</dt>
              <dd>
                Click Sign in and create an account with Apixis ID. Your
                account comes with 1,000 starter Ixis and your own avatar agent
                in the Apixis world.
              </dd>

              <dt>What are Ixis?</dt>
              <dd>
                Ixis is the Apixis family credit. 100 Ixis = $1. You pay for
                your Renoxis seat and AI features with Ixis through Apixis
                Wallet. Paid Ixis never expires.
              </dd>

              <dt>How do I activate my workspace?</dt>
              <dd>
                After signing in, redeem the start fee and first month from your
                dashboard. If you need more Ixis, click Buy Ixis to open Apixis
                Wallet.
              </dd>

              <dt>Can I cancel?</dt>
              <dd>
                The monthly plan is meant to renew every month. Card auto-renew
                is not available yet. With Ixis, renew from your workspace when
                the paid month is due. There is no cancel button in settings.
                Email{" "}
                <a href="mailto:renoxis@apixis.dev">renoxis@apixis.dev</a> if
                you need help with a charge.
              </dd>

              <dt>Is my data secure?</dt>
              <dd>
                Yes. All contact, property, and deal data is stored with
                row-level security in Supabase. Only you and authorized team
                members can access your workspace.
              </dd>
            </dl>
          </div>
        </section>
      </main>

      <footer className="welcome-footer">
        <span>
          RENOXIS <b>·</b> A Apixis Company <b>·</b> People. Properties. A
          brighter tomorrow.
        </span>
        <div>
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/support">Support</Link>
          <Link href="/tour">Tour with Cixy</Link>
        </div>
        <FooterSocial />
        <OtherIxisCompanies />
      </footer>
    </div>
  );
}
