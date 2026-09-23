-- Billing entitlements move OUT of renoxis_records (customer-writable, owner policy) into a
-- table no customer role can touch. Only the server (service role) reads or writes it.
-- The Wallet remains proof of purchase; this table holds the seat dates the server computed.
create table if not exists public.renoxis_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  activated_at timestamptz,
  seat_period_end timestamptz,
  source text not null check (source in ('wallet_capture')),
  last_receipt_id text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.renoxis_entitlements enable row level security;
revoke all on public.renoxis_entitlements from anon, authenticated;
-- no policies on purpose: with RLS on and no policy, anon/authenticated get nothing; service_role bypasses RLS.

-- Copy the existing cache rows (written by the redeem route at capture time), then remove the
-- kind so customers can no longer write access-granting rows into their own records table.
insert into public.renoxis_entitlements (user_id, activated_at, seat_period_end, source)
select user_id,
       nullif(data->>'activatedAt','wallet')::timestamptz,
       (data->>'seatPeriodEnd')::timestamptz,
       'wallet_capture'
from public.renoxis_records
where kind='entitlement' and data->>'source'='wallet_capture'
on conflict (user_id) do nothing;

delete from public.renoxis_records where kind='entitlement';
alter table public.renoxis_records drop constraint if exists renoxis_records_kind_check;
alter table public.renoxis_records add constraint renoxis_records_kind_check
  check (kind = any (array['lead','client','property','transaction','task','event','renovation','social','document','draft','settings']));
