import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Renoxis",
  description:
    "How the Renoxis closed beta handles accounts, CRM records, documents, and Cixy.",
};

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Renoxis is a closed-beta real-estate workspace from Apixis. This policy
        describes the product as it works today. It does not describe wallet
        checkout, card payments, MLS import, or sending email, because those
        are not enabled.
      </p>

      <h2>Account</h2>
      <p>
        Sign-in is a magic link sent to the email address you enter. Supabase
        stores the account and the session cookie that keeps you signed in.
        Renoxis does not ask you to create a password. Keep access to that
        inbox, and do not paste passwords or API keys into the workspace or
        into chat.
      </p>

      <h2>CRM records and private documents</h2>
      <p>
        When you are signed in, you can save leads, clients, properties,
        transactions, tasks, appointments, renovation notes, social drafts,
        email drafts, document links, and workspace preferences. You can also
        upload private PDF, PNG, JPG, or text files up to 4 MB. Supabase stores
        those records and files for your account. Other customers are not meant
        to read them. Download links for uploaded files are short-lived.
      </p>
      <p>
        You can edit or delete individual records, delete uploaded files, and
        export the records the workspace returns as JSON. Signing out ends the
        session in that browser. This beta does not include a self-serve
        control that deletes the whole account. Ask the person who invited you
        if the account itself should be removed.
      </p>
      <p>
        Cixy appearance choices save on this device. They are not a copy of
        your CRM.
      </p>

      <h2>Cixy and listing helpers</h2>
      <p>
        Chat with Cixy and listing-copy generation use Anthropic only when this
        deployment has an Anthropic API key configured. If it is not
        configured, or the provider cannot complete the request, those features
        stay unavailable and your saved records remain in Supabase.
      </p>
      <p>
        When a request does run, the text you submit is sent to Anthropic. Chat
        also sends a limited snapshot of saved workspace fields so Cixy can
        refer to them. Renoxis does not keep a server archive of the chat.
        The conversation stays in that browser session. Cixy cannot read your
        inbox, fetch a listing page, or send messages from chat.
      </p>

      <h2>Google Connect</h2>
      <p>
        Connecting Google is optional, and only after the site owner finishes
        Google setup. If you connect your own account, Renoxis can read Gmail
        metadata and snippets and can read calendar events. Publishing a
        calendar event requires your review, does not invite attendees, and
        does not send mail. Connection tokens are encrypted on the server. You
        can disconnect Google from Connections. This is not a live “send mail”
        feature.
      </p>

      <h2>Drafts, and what is not live</h2>
      <p>
        You may save an email draft or ask Cixy to draft an offer letter. Those
        stay as drafts in your workspace or in the chat session. Renoxis does
        not send them. Outbound email is not silently enabled. A real send, if
        one is added later, would have to wait for your explicit approval.
      </p>
      <p>
        Buy Ixis leaves this site for Apixis Wallet. The link opens Wallet
        buy for Renoxis and returns to this site’s Cixy Studio. It does not send
        your records, email, or office balance. Renoxis does not receive card
        numbers and does not complete a purchase. Licensed MLS feeds, Outlook,
        external CRM sync, social publishing, and renovation image generation are not
        connected. A public listing link you save is only the link you typed.
        Commission figures are numbers you enter, not a cash balance.
      </p>

      <h2>Fair housing</h2>
      <p>
        Use Renoxis for factual, inclusive property descriptions. Do not use it
        to target, prefer, or exclude people in housing advertisements or
        outreach based on race, color, religion, sex, national origin,
        disability, familial status, or other characteristics protected by fair
        housing law.
      </p>

      <h2>Who else handles data</h2>
      <ul>
        <li>Supabase — accounts, sessions, CRM records, and private files.</li>
        <li>
          Anthropic — AI requests, only when you use Cixy or listing copy and
          the provider is configured.
        </li>
        <li>
          Google — Gmail and Calendar data, only if you choose to connect
          Google.
        </li>
      </ul>
      <p>
        Renoxis does not sell workspace data and does not share one customer’s
        records with another Apixis company. There is no separate advertising
        or analytics tracker in the product. The Analytics view adds up records
        you saved.
      </p>

      <h2>Contact</h2>
      <p>
        This beta does not publish a support form or a separate privacy inbox
        inside the product. For a privacy question or an account-removal
        request, contact the operator who invited you. These pages stay
        available without signing in. The <Link href="/terms">Terms of Service</Link>{" "}
        describe how the beta may be used.
      </p>
    </LegalPage>
  );
}
