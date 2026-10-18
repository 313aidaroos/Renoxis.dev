import { IxisCompanies } from "./IxisCompanies";

/** "Ixis companies" hover card inside the public .welcome-footer. */
export function OtherIxisCompanies() {
  return (
    <div className="welcome-footer-ixis">
      <IxisCompanies current="Renoxis" />
    </div>
  );
}
