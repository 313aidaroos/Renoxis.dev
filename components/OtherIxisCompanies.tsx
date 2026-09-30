import { OTHER_IXIS_COMPANIES } from "@/lib/renoxis/ixis-companies";

// "Other Ixis companies" row inside the public .welcome-footer.
export default function OtherIxisCompanies() {
  return (
    <nav className="welcome-footer-ixis" aria-label="Other Ixis companies">
      <span>Other Ixis companies</span>
      <div>
        {OTHER_IXIS_COMPANIES.map((c) => (
          <a key={c.url} href={c.url} target="_blank" rel="noopener noreferrer">{c.name}</a>
        ))}
      </div>
    </nav>
  );
}
