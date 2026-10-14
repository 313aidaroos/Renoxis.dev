import { OTHER_IXIS_COMPANIES } from "@/lib/renoxis/ixis-companies";

/** "Other Ixis companies" row inside the public .welcome-footer. */
export function OtherIxisCompanies() {
  return (
    <nav className="welcome-footer-ixis" aria-label="Other Ixis companies">
      <span>Other Ixis companies</span>
      <div>
        {OTHER_IXIS_COMPANIES.map((company) => (
          <a key={company.url} href={company.url} target="_blank" rel="noopener noreferrer">
            {company.name}
          </a>
        ))}
      </div>
    </nav>
  );
}
