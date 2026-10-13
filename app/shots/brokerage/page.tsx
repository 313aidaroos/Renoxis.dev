import { notFound } from "next/navigation";
import CommandDesk from "@/components/CommandDesk";
import type { FirmDesk } from "@/components/TeamDesk";

const officeId = "11111111-1111-4111-8111-111111111111";

const ownerFirm: FirmDesk = {
  ready: true,
  userId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  offices: [
    {
      id: officeId,
      name: "Harbor Street Realty",
      slug: "harbor-street-realty",
      status: "active",
      role: "owner",
      balance: null,
      billedToOffice: true,
    },
  ],
  office: {
    id: officeId,
    name: "Harbor Street Realty",
    slug: "harbor-street-realty",
    status: "active",
    role: "owner",
    balance: null,
    billedToOffice: true,
  },
  members: [
    {
      id: "m1",
      email: "jordan.hale@harbor.test",
      role: "owner",
      status: "active",
      user_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    },
    {
      id: "m2",
      email: "maya.chen@harbor.test",
      role: "agent",
      status: "active",
      user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    },
    {
      id: "m3",
      email: "sam.okonkwo@harbor.test",
      role: "broker",
      status: "invited",
      user_id: null,
    },
  ],
  invites: [
    {
      id: "i1",
      email: "sam.okonkwo@harbor.test",
      role: "broker",
      expires_at: "2026-10-20T00:00:00Z",
    },
  ],
  notes: [],
  outbox: [],
  commissions: [
    { id: "c1", fee_base: 12000, bps: 500, amount: 600, status: "pending" },
  ],
  access: {
    masterAdmin: false,
    canRename: true,
    canInvite: true,
    canRemove: true,
    canViewSpend: true,
  },
  wallet: {
    available: 8400,
    buy: "https://apixis-wallet.vercel.app/buy?product=renoxis&return_url=https%3A%2F%2Frenoxis.dev%2F%3Fboard%3DBrokerage",
  },
  spendByUser: {
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa": { spent: 175, jobs: 3 },
  },
  activity: [
    {
      id: "a1",
      sku: "offer_letter",
      label: "Offer letter",
      amount: 100,
      email: "maya.chen@harbor.test",
      at: "2026-10-06T14:00:00Z",
    },
    {
      id: "a2",
      sku: "email_draft",
      label: "Email",
      amount: 50,
      email: "maya.chen@harbor.test",
      at: "2026-10-06T13:00:00Z",
    },
    {
      id: "a3",
      sku: "property_lookup",
      label: "Property lookup",
      amount: 25,
      email: "maya.chen@harbor.test",
      at: "2026-10-05T18:00:00Z",
    },
  ],
  billedToOffice: true,
};

const agentFirm: FirmDesk = {
  ...ownerFirm,
  userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  office: { ...ownerFirm.office!, role: "agent" },
  offices: [{ ...ownerFirm.offices[0], role: "agent" }],
  access: {
    masterAdmin: false,
    canRename: false,
    canInvite: false,
    canRemove: false,
    canViewSpend: false,
  },
  wallet: null,
  activity: [],
  spendByUser: {},
  invites: [],
};

export default async function BrokerageShots({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const agent = params.view === "agent";
  return (
    <CommandDesk
      account={agent ? "Maya Chen" : "Jordan Hale"}
      entitlement={{
        activatedAt: "2026-10-01T00:00:00.000Z",
        seatPeriodEnd: "2027-10-01T00:00:00.000Z",
        source: "wallet_capture",
      }}
      demo={{ firm: agent ? agentFirm : ownerFirm, board: "Brokerage" }}
      walletHref="https://apixis-wallet.vercel.app/buy?product=renoxis&return_url=https%3A%2F%2Frenoxis.dev%2F%3Fboard%3DBrokerage"
    />
  );
}
