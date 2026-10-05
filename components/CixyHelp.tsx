// 2026-09-28 Grok Developer Bot: Cixy sign-in help beside every Renoxis login form.
// Renoxis has no public (signed-out) Cixy chat yet: its CixyChat needs a signed-in session.
// So this card answers the common sign-in questions on the page and links to the public
// Apixis Cixy chat, which knows Apixis ID sign-in help.
export const CIXY_HELP_CHAT = "https://apixis.dev/login#ask-cixy";

const FAQ: [string, string][] = [
  [
    "What is Apixis ID?",
    "One account for Renoxis, Apixis Wallet and every Apixis company. Log in with Apixis ID signs you in here with it, and your Ixis balance comes with you.",
  ],
  [
    "I forgot my password",
    "Signed up with Apixis ID? Choose Log in with Apixis ID, then Forgot password? on that page. Use a Renoxis email password? Open the Password tab and choose Forgot password?. We email a link to set a new one. Or skip passwords and use an email link.",
  ],
  [
    "How does the email link work?",
    "Enter your email and we send a one-time sign-in link. Open it on this device within an hour. The link is for existing Renoxis email accounts. New here? Choose Log in with Apixis ID to create your account.",
  ],
];

export function CixyHelp({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="cixy-help cixy-help-compact">
        <img src="/cixy/cixy-combo-a-avatar.webp" alt="Cixy, your Renoxis guide" width={48} height={48} />
        <p>
          Need help signing in?{" "}
          <a href="/login#cixy-help">Ask Cixy</a>
        </p>
      </div>
    );
  }
  return (
    <section className="cixy-help" id="cixy-help" aria-labelledby="cixy-help-title">
      <div className="cixy-help-head">
        <img src="/cixy/cixy-combo-a-avatar.webp" alt="Cixy, your Renoxis guide" width={72} height={72} />
        <div>
          <span className="welcome-kicker"><i /> CIXY · SIGN-IN HELP</span>
          <h2 id="cixy-help-title">Need help signing in?</h2>
        </div>
      </div>
      <div className="cixy-help-faq">
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <a className="cixy-help-ask" href={CIXY_HELP_CHAT} target="_blank" rel="noopener noreferrer">
        Ask Cixy <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
