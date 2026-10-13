import "./footer-social.css";

// Instagram oEmbed (2026-10-13) titles this profile
// "Renoxis RE Company's (@renoxis.dev) profile on Instagram".
// facebook.com/renoxis.dev did not resolve to a page, so it is not linked.
export function FooterSocial() {
  return (
    <a
      className="footer-social"
      href="https://www.instagram.com/renoxis.dev/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Renoxis on Instagram"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <rect
          x="3.25"
          y="3.25"
          width="17.5"
          height="17.5"
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.35" cy="6.65" r="1.05" fill="currentColor" />
      </svg>
    </a>
  );
}
