import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Renoxis",
  description:
    "Closed-beta terms for the Renoxis real-estate workspace and Cixy assistant.",
};

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms cover use of the Renoxis closed beta, a real-estate
        workspace from Apixis. By signing in or saving data, you agree to
        them. You can read them without an account. The{" "}
        <Link href="/privacy">Privacy Policy</Link> explains what is stored.
      </p>

      <h2>The beta</h2>
      <p>
        Access is limited to this closed beta. Features can change, pause, or
        be removed. A status that says a provider is “configured” means the
        deployment has the setting; it does not promise that a paid AI call,
        Google consent, or any other provider step has succeeded. The beta is
        offered as available, without a service-level commitment.
      </p>

      <h2>Your account and your records</h2>
      <p>
        You sign in with a magic link to an email you control. You are
        responsible for that inbox and for anyone who uses a browser where you
        are signed in. Records, files, and drafts you enter are yours to
        maintain. You are responsible for their accuracy and for having the
        right to store them in a CRM. Do not enter passwords or API keys.
      </p>
      <p>
        You can edit and delete records, delete uploaded files, and export
        records as JSON. Export covers the records the workspace returns, which
        can be capped. There is no in-product button that deletes the entire
        account. Keep your own copies of anything you cannot afford to lose.
      </p>

      <h2>Acceptable use and fair housing</h2>
      <p>
        Use Renoxis for lawful real-estate work. Do not use it to harass,
        stalk, or build sensitive profiles of people, to reach into another
        customer’s workspace, or to pull secrets out of the assistant.
      </p>
      <p>
        Advertise with factual, inclusive copy. Do not use Renoxis to target or
        exclude people in housing ads or outreach based on race, color,
        religion, sex, national origin, disability, familial status, or other
        protected characteristics. You are responsible for what you publish
        outside Renoxis.
      </p>

      <h2>Cixy, drafts, and sending</h2>
      <p>
        Cixy and the listing helper are drafting aids. They can be wrong. They
        are not a broker, lawyer, lender, appraiser, inspector, or fair-housing
        authority. Check facts, license rules, and current law before you rely
        on a draft. Offer letters, emails, listing copy, and social posts
        created here are drafts for you to review.
      </p>
      <p>
        Renoxis does not send email, offer letters, or social posts. Sending is
        not silently enabled. If a send feature is added later, it would
        require your explicit approval before anything left your account.
      </p>

      <h2>Connections and payments</h2>
      <p>
        Google Connect is optional. Today it is read-oriented for mail: inbox
        snippets and calendar events you authorize. Creating a calendar event
        still requires your review and does not invite attendees or send mail.
        Outlook, MLS feeds, and external CRM sync are not part of this beta.
      </p>
      <p>
        Buy Ixis and Wallet open Apixis Wallet. Renoxis does not run checkout,
        store card details, or credit Ixis from a card payment. Cash credit
        happens only on Apixis Wallet. No purchase is completed inside Renoxis.
        A price marked “to be set” or “coming soon” is not an offer.
      </p>

      <h2>No professional advice</h2>
      <p>
        Nothing in Renoxis is legal, tax, lending, appraisal, or brokerage
        advice. Commission totals are estimates from numbers you enter, not
        money held for you. To the extent the law allows for a closed beta,
        Apixis and Renoxis are not liable for lost deals, incorrect drafts, or
        decisions you make from the workspace.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms during the beta. The date at the top of this
        page will change. Continuing to use Renoxis after an update means you
        accept the updated terms.
      </p>
      <p>
        This beta does not publish a support inbox inside the product. Questions
        about these terms go to the operator who invited you.
      </p>
    </LegalPage>
  );
}
