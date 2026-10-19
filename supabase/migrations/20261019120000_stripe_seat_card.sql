-- Card seat grants. Not applied by the change that added this file.
-- Service role only. Existing Wallet rows stay source wallet_capture.
begin;

alter table public.renoxis_entitlements
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

do $$
declare r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'renoxis_entitlements'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%source%'
  loop
    execute format('alter table public.renoxis_entitlements drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.renoxis_entitlements
  add constraint renoxis_entitlements_source_check
  check (source in ('wallet_capture', 'card'));

create unique index if not exists renoxis_entitlements_stripe_subscription
  on public.renoxis_entitlements (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.renoxis_stripe_events (
  event_id text primary key,
  event_type text not null,
  created_at timestamptz not null default now()
);
alter table public.renoxis_stripe_events enable row level security;
revoke all on public.renoxis_stripe_events from public, anon, authenticated;
grant all on public.renoxis_stripe_events to service_role;

commit;
