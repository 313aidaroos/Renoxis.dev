-- Renoxis brokerage v1. Additive. Personal records stay user-scoped.
-- Prices must match lib/renoxis/ixis.ts: lookup 0, track 0, email 50, offer 100, commission 500 bps.
-- Privileged helpers live in renoxis_private (not an exposed Data API schema).

create schema if not exists renoxis_private;
revoke all on schema renoxis_private from public, anon;
grant usage on schema renoxis_private to authenticated, service_role;

create table if not exists public.brokerages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60),
  created_by uuid not null references auth.users (id),
  status text not null default 'active' check (status in ('active', 'archived')),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object' and octet_length(settings::text) < 8000),
  ixis_balance integer not null default 0 check (ixis_balance >= 0 and ixis_balance <= 1000000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brokerage_members (
  id uuid primary key default gen_random_uuid(),
  brokerage_id uuid not null references public.brokerages (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 200),
  role text not null check (role in ('owner', 'broker', 'agent', 'assistant')),
  status text not null default 'active' check (status in ('invited', 'active', 'removed')),
  invited_by uuid references auth.users (id),
  invited_at timestamptz not null default now(),
  joined_at timestamptz
);
create unique index if not exists brokerage_members_email on public.brokerage_members (brokerage_id, email);
create unique index if not exists brokerage_members_user on public.brokerage_members (brokerage_id, user_id) where user_id is not null;
create index if not exists brokerage_members_user_status on public.brokerage_members (user_id, status);

create table if not exists public.brokerage_invites (
  id uuid primary key default gen_random_uuid(),
  brokerage_id uuid not null references public.brokerages (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 200),
  role text not null check (role in ('owner', 'broker', 'agent', 'assistant')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users (id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists brokerage_invites_office on public.brokerage_invites (brokerage_id, email);

alter table public.renoxis_records
  add column if not exists brokerage_id uuid references public.brokerages (id) on delete cascade,
  add column if not exists owner_agent_id uuid references auth.users (id) on delete set null,
  add column if not exists visibility text not null default 'firm',
  add column if not exists external_ref text;
do $$ begin
  alter table public.renoxis_records
    add constraint renoxis_visibility_check check (visibility in ('firm', 'book', 'private'));
exception when duplicate_object then null;
end $$;
create index if not exists renoxis_records_brokerage on public.renoxis_records (brokerage_id, kind);
create unique index if not exists renoxis_records_external_ref on public.renoxis_records (brokerage_id, external_ref) where external_ref is not null;

create table if not exists public.renoxis_notes (
  id uuid primary key default gen_random_uuid(),
  brokerage_id uuid not null references public.brokerages (id) on delete cascade,
  record_id uuid references public.renoxis_records (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  body text not null check (char_length(body) between 1 and 10000),
  shared boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists renoxis_notes_office on public.renoxis_notes (brokerage_id, created_at desc);

create table if not exists public.brokerage_ixis_ledger (
  id uuid primary key default gen_random_uuid(),
  brokerage_id uuid not null references public.brokerages (id) on delete cascade,
  sku text not null check (sku in ('property_lookup', 'track_contact', 'email_draft', 'offer_letter', 'office_grant')),
  amount_ixis integer not null,
  actor_user_id uuid not null references auth.users (id),
  ref text,
  created_at timestamptz not null default now()
);
create index if not exists brokerage_ixis_ledger_office on public.brokerage_ixis_ledger (brokerage_id, created_at desc);
create unique index if not exists brokerage_ixis_ledger_ref on public.brokerage_ixis_ledger (brokerage_id, sku, ref) where ref is not null;

create table if not exists public.platform_commission (
  id uuid primary key default gen_random_uuid(),
  brokerage_id uuid not null references public.brokerages (id) on delete cascade,
  record_id uuid not null references public.renoxis_records (id) on delete cascade,
  fee_base numeric not null check (fee_base >= 0),
  bps integer not null default 500 check (bps = 500),
  amount numeric not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'invoiced', 'paid')),
  created_at timestamptz not null default now()
);
create unique index if not exists platform_commission_record on public.platform_commission (brokerage_id, record_id);

create table if not exists public.renoxis_outbox (
  id uuid primary key default gen_random_uuid(),
  brokerage_id uuid not null references public.brokerages (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  kind text not null check (kind in ('email', 'offer')),
  to_email text,
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 10000),
  status text not null default 'draft' check (status in ('draft', 'pending_approve', 'approved', 'rejected')),
  approved boolean not null default false,
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  provider text not null default 'not_configured' check (provider in ('not_configured', 'blocked')),
  ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists renoxis_outbox_ref on public.renoxis_outbox (brokerage_id, ref) where ref is not null;
create index if not exists renoxis_outbox_office on public.renoxis_outbox (brokerage_id, created_at desc);
create index if not exists brokerage_invites_invited_by on public.brokerage_invites (invited_by);
create index if not exists brokerage_ixis_ledger_actor on public.brokerage_ixis_ledger (actor_user_id);
create index if not exists brokerage_members_invited_by on public.brokerage_members (invited_by);
create index if not exists brokerages_created_by on public.brokerages (created_by);
create index if not exists platform_commission_record_id on public.platform_commission (record_id);
create index if not exists renoxis_notes_author on public.renoxis_notes (author_id);
create index if not exists renoxis_notes_record on public.renoxis_notes (record_id);
create index if not exists renoxis_outbox_approved_by on public.renoxis_outbox (approved_by);
create index if not exists renoxis_outbox_author on public.renoxis_outbox (author_id);
create index if not exists renoxis_records_owner_agent on public.renoxis_records (owner_agent_id);

-- Balance moves only while the ledger function holds this transaction flag.
create or replace function renoxis_private.guard_balance()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.ixis_balance is distinct from old.ixis_balance
     and current_setting('renoxis.ledger', true) is distinct from 'on' then
    raise exception 'Office Ixis balance can only change through the ledger.';
  end if;
  return new;
end $$;
drop trigger if exists renoxis_guard_balance on public.brokerages;
create trigger renoxis_guard_balance
  before update on public.brokerages
  for each row execute function renoxis_private.guard_balance();

create or replace function renoxis_private.on_brokerage_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.brokerage_members (brokerage_id, user_id, email, role, status, invited_by, joined_at)
  values (
    new.id,
    new.created_by,
    lower(coalesce(auth.jwt() ->> 'email', 'owner@unknown.invalid')),
    'owner',
    'active',
    new.created_by,
    now()
  );
  return new;
end $$;
drop trigger if exists renoxis_brokerage_owner on public.brokerages;
create trigger renoxis_brokerage_owner
  after insert on public.brokerages
  for each row execute function renoxis_private.on_brokerage_created();

create or replace function renoxis_private.keep_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.role = 'owner' and old.status = 'active'
     and (new.role <> 'owner' or new.status <> 'active')
     and (
       select count(*) from public.brokerage_members
       where brokerage_id = old.brokerage_id and role = 'owner' and status = 'active' and id <> old.id
     ) < 1 then
    raise exception 'The office needs one active owner.';
  end if;
  return new;
end $$;
drop trigger if exists renoxis_keep_owner on public.brokerage_members;
create trigger renoxis_keep_owner
  before update on public.brokerage_members
  for each row execute function renoxis_private.keep_owner();

create or replace function renoxis_private.member_role(bid uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.brokerage_members
  where brokerage_id = bid and user_id = (select auth.uid()) and status = 'active'
  limit 1;
$$;

-- Sketch matched by lib/renoxis/access.ts canReadRecord.
create or replace function renoxis_private.can_read_record(bid uuid, owner_agent uuid, visibility text, author uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when (select auth.uid()) is null then false
    when renoxis_private.member_role(bid) is null then false
    when author = (select auth.uid()) then true
    when renoxis_private.member_role(bid) in ('owner', 'broker') then true
    when visibility = 'firm' then true
    when visibility = 'book' and owner_agent = (select auth.uid()) then true
    else false
  end;
$$;

create or replace function renoxis_private.can_read_note(bid uuid, author uuid, shared boolean)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when (select auth.uid()) is null then false
    when renoxis_private.member_role(bid) is null then false
    when author = (select auth.uid()) then true
    when renoxis_private.member_role(bid) in ('owner', 'broker') then true
    when shared then true
    else false
  end;
$$;

create or replace function renoxis_private.debit_ixis(bid uuid, sku text, ref text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := (select auth.uid());
  actor text;
  cost integer;
  bal integer;
  show_balance boolean;
  existing uuid;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to use your workspace.');
  end if;
  actor := renoxis_private.member_role(bid);
  if actor is null then
    return jsonb_build_object('ok', false, 'error', 'You are not an active member of this office.');
  end if;
  cost := case sku
    when 'property_lookup' then 0  -- saves typed facts only; no data source yet → free until real
    when 'track_contact' then 0
    when 'email_draft' then 50
    when 'offer_letter' then 100
    else null
  end;
  if cost is null then
    return jsonb_build_object('ok', false, 'error', 'Unknown Ixis action.');
  end if;
  show_balance := actor in ('owner', 'broker');
  if ref is not null and char_length(ref) > 0 then
    select id into existing from public.brokerage_ixis_ledger
    where brokerage_id = bid and brokerage_ixis_ledger.sku = debit_ixis.sku and brokerage_ixis_ledger.ref = debit_ixis.ref
    limit 1;
    if existing is not null then
      select ixis_balance into bal from public.brokerages where id = bid;
      return jsonb_build_object('ok', true, 'idempotent', true, 'cost', cost, 'balance', case when show_balance then bal else null end, 'billed_to_office', true);
    end if;
  end if;
  perform set_config('renoxis.ledger', 'on', true);
  update public.brokerages
    set ixis_balance = ixis_balance - cost, updated_at = now()
    where id = bid and ixis_balance >= cost
    returning ixis_balance into bal;
  if bal is null then
    select ixis_balance into bal from public.brokerages where id = bid;
    return jsonb_build_object(
      'ok', false,
      'error', 'INSUFFICIENT',
      'cost', cost,
      'balance', case when show_balance then bal else null end,
      'billed_to_office', true,
      'shortfall', greatest(cost - coalesce(bal, 0), 0)
    );
  end if;
  insert into public.brokerage_ixis_ledger (brokerage_id, sku, amount_ixis, actor_user_id, ref)
  values (bid, sku, -cost, uid, nullif(ref, ''));
  return jsonb_build_object('ok', true, 'idempotent', false, 'cost', cost, 'balance', case when show_balance then bal else null end, 'billed_to_office', true);
end $$;

create or replace function renoxis_private.grant_ixis(bid uuid, amount integer, note text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := (select auth.uid());
  bal integer;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to use your workspace.');
  end if;
  if renoxis_private.member_role(bid) is distinct from 'owner' then
    return jsonb_build_object('ok', false, 'error', 'Only an owner can record an office grant.');
  end if;
  if amount is null or amount < 1 or amount > 1000000 then
    return jsonb_build_object('ok', false, 'error', 'Grant must be from 1 to 1,000,000 Ixis.');
  end if;
  perform set_config('renoxis.ledger', 'on', true);
  update public.brokerages
    set ixis_balance = ixis_balance + amount, updated_at = now()
    where id = bid
    returning ixis_balance into bal;
  if bal is null then
    return jsonb_build_object('ok', false, 'error', 'Office not found.');
  end if;
  insert into public.brokerage_ixis_ledger (brokerage_id, sku, amount_ixis, actor_user_id, ref)
  values (bid, 'office_grant', amount, uid, gen_random_uuid()::text);
  return jsonb_build_object('ok', true, 'balance', bal, 'amount', amount);
end $$;

create or replace function renoxis_private.accept_invite(raw_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  uid uuid := (select auth.uid());
  email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  inv public.brokerage_invites%rowtype;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to use your workspace.');
  end if;
  if email = '' then
    return jsonb_build_object('ok', false, 'error', 'Your account has no email address.');
  end if;
  if raw_token is null or char_length(raw_token) < 20 or char_length(raw_token) > 200 then
    return jsonb_build_object('ok', false, 'error', 'This invite is invalid or expired.');
  end if;
  select * into inv from public.brokerage_invites
  where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
    and accepted_at is null
    and expires_at > now();
  if inv.id is null then
    return jsonb_build_object('ok', false, 'error', 'This invite is invalid or expired.');
  end if;
  if lower(inv.email) <> email then
    return jsonb_build_object('ok', false, 'error', 'Sign in with the invited email address.');
  end if;
  insert into public.brokerage_members (brokerage_id, user_id, email, role, status, invited_by, joined_at)
  values (inv.brokerage_id, uid, email, inv.role, 'active', inv.invited_by, now())
  on conflict (brokerage_id, email) do update
    set user_id = excluded.user_id,
        status = 'active',
        joined_at = coalesce(public.brokerage_members.joined_at, now()),
        role = case
          when public.brokerage_members.role = 'owner' then public.brokerage_members.role
          else excluded.role
        end;
  update public.brokerage_invites set accepted_at = now() where id = inv.id;
  return jsonb_build_object('ok', true, 'brokerage_id', inv.brokerage_id, 'role', inv.role);
end $$;

create or replace function renoxis_private.record_platform_commission(target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := (select auth.uid());
  rec public.renoxis_records%rowtype;
  fee numeric;
  cut numeric;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to use your workspace.');
  end if;
  select * into rec from public.renoxis_records where id = target;
  if rec.id is null or rec.kind <> 'transaction' or rec.brokerage_id is null then
    return jsonb_build_object('ok', false, 'skipped', true);
  end if;
  if rec.user_id <> uid and renoxis_private.member_role(rec.brokerage_id) not in ('owner', 'broker') then
    return jsonb_build_object('ok', false, 'error', 'You cannot record commission on this deal.');
  end if;
  if coalesce(rec.data ->> 'status', '') <> 'Closed' then
    return jsonb_build_object('ok', false, 'skipped', true);
  end if;
  fee := nullif(rec.data ->> 'commission', '')::numeric;
  if fee is null or fee < 0 then
    return jsonb_build_object('ok', false, 'skipped', true);
  end if;
  cut := round(fee * 500 / 10000, 2);
  insert into public.platform_commission (brokerage_id, record_id, fee_base, bps, amount, status)
  values (rec.brokerage_id, rec.id, fee, 500, cut, 'pending')
  on conflict (brokerage_id, record_id) do update
    set fee_base = excluded.fee_base, amount = excluded.amount
    where public.platform_commission.status = 'pending';
  return jsonb_build_object('ok', true, 'bps', 500, 'fee_base', fee, 'amount', cut, 'status', 'pending');
end $$;

create or replace function renoxis_private.office_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'name', b.name,
    'slug', b.slug,
    'status', b.status,
    'role', m.role,
    'balance', case when m.role in ('owner', 'broker') then b.ixis_balance else null end,
    'billedToOffice', true
  ) order by b.created_at), '[]'::jsonb)
  from public.brokerage_members m
  join public.brokerages b on b.id = m.brokerage_id
  where m.user_id = (select auth.uid()) and m.status = 'active';
$$;

-- Thin public wrappers. Invoker only; privileged work stays in renoxis_private.
create or replace function public.renoxis_debit_ixis(bid uuid, sku text, ref text)
returns jsonb language sql volatile security invoker
set search_path = public, renoxis_private, pg_temp
as $$ select renoxis_private.debit_ixis(bid, sku, ref); $$;

create or replace function public.renoxis_grant_ixis(bid uuid, amount integer, note text)
returns jsonb language sql volatile security invoker
set search_path = public, renoxis_private, pg_temp
as $$ select renoxis_private.grant_ixis(bid, amount, note); $$;

create or replace function public.renoxis_accept_invite(token text)
returns jsonb language sql volatile security invoker
set search_path = public, renoxis_private, pg_temp
as $$ select renoxis_private.accept_invite(token); $$;

create or replace function public.renoxis_record_platform_commission(record_id uuid)
returns jsonb language sql volatile security invoker
set search_path = public, renoxis_private, pg_temp
as $$ select renoxis_private.record_platform_commission(record_id); $$;

create or replace function public.renoxis_office_snapshot()
returns jsonb language sql stable security invoker
set search_path = public, renoxis_private, pg_temp
as $$ select renoxis_private.office_snapshot(); $$;

revoke all on all functions in schema renoxis_private from public, anon;
grant execute on all functions in schema renoxis_private to authenticated, service_role;
revoke all on function public.renoxis_debit_ixis(uuid, text, text) from public, anon;
revoke all on function public.renoxis_grant_ixis(uuid, integer, text) from public, anon;
revoke all on function public.renoxis_accept_invite(text) from public, anon;
revoke all on function public.renoxis_record_platform_commission(uuid) from public, anon;
revoke all on function public.renoxis_office_snapshot() from public, anon;
grant execute on function public.renoxis_debit_ixis(uuid, text, text) to authenticated;
grant execute on function public.renoxis_grant_ixis(uuid, integer, text) to authenticated;
grant execute on function public.renoxis_accept_invite(text) to authenticated;
grant execute on function public.renoxis_record_platform_commission(uuid) to authenticated;
grant execute on function public.renoxis_office_snapshot() to authenticated;

alter table public.brokerages enable row level security;
alter table public.brokerage_members enable row level security;
alter table public.brokerage_invites enable row level security;
alter table public.renoxis_notes enable row level security;
alter table public.brokerage_ixis_ledger enable row level security;
alter table public.platform_commission enable row level security;
alter table public.renoxis_outbox enable row level security;

revoke all on public.brokerages from anon, authenticated;
grant select (id, name, slug, created_by, status, settings, created_at, updated_at) on public.brokerages to authenticated;
grant insert (name, slug, created_by, status, settings) on public.brokerages to authenticated;
grant update (name, settings, updated_at) on public.brokerages to authenticated;
grant all on public.brokerages to service_role;

revoke all on public.brokerage_members from anon, authenticated;
grant select, update (role, status) on public.brokerage_members to authenticated;
grant all on public.brokerage_members to service_role;

revoke all on public.brokerage_invites from anon, authenticated;
grant select (id, brokerage_id, email, role, expires_at, accepted_at, invited_by, created_at),
      insert (brokerage_id, email, role, token_hash, invited_by, expires_at)
  on public.brokerage_invites to authenticated;
grant all on public.brokerage_invites to service_role;

revoke all on public.renoxis_notes from anon, authenticated;
grant select, insert, update on public.renoxis_notes to authenticated;
grant all on public.renoxis_notes to service_role;

revoke all on public.brokerage_ixis_ledger from anon, authenticated;
grant select on public.brokerage_ixis_ledger to authenticated;
grant all on public.brokerage_ixis_ledger to service_role;

revoke all on public.platform_commission from anon, authenticated;
grant select on public.platform_commission to authenticated;
grant all on public.platform_commission to service_role;

revoke all on public.renoxis_outbox from anon, authenticated;
grant select, insert, update on public.renoxis_outbox to authenticated;
grant all on public.renoxis_outbox to service_role;

drop policy if exists renoxis_brokerage_read on public.brokerages;
create policy renoxis_brokerage_read on public.brokerages
  for select to authenticated
  using (renoxis_private.member_role(id) is not null);
drop policy if exists renoxis_brokerage_insert on public.brokerages;
create policy renoxis_brokerage_insert on public.brokerages
  for insert to authenticated
  with check ((select auth.uid()) = created_by and status = 'active');
drop policy if exists renoxis_brokerage_update on public.brokerages;
create policy renoxis_brokerage_update on public.brokerages
  for update to authenticated
  using (renoxis_private.member_role(id) = 'owner')
  with check (renoxis_private.member_role(id) = 'owner');

drop policy if exists renoxis_member_read on public.brokerage_members;
create policy renoxis_member_read on public.brokerage_members
  for select to authenticated
  using (renoxis_private.member_role(brokerage_id) is not null);
drop policy if exists renoxis_member_update on public.brokerage_members;
create policy renoxis_member_update on public.brokerage_members
  for update to authenticated
  using (renoxis_private.member_role(brokerage_id) = 'owner')
  with check (renoxis_private.member_role(brokerage_id) = 'owner');

drop policy if exists renoxis_invite_read on public.brokerage_invites;
create policy renoxis_invite_read on public.brokerage_invites
  for select to authenticated
  using (renoxis_private.member_role(brokerage_id) in ('owner', 'broker'));
drop policy if exists renoxis_invite_insert on public.brokerage_invites;
create policy renoxis_invite_insert on public.brokerage_invites
  for insert to authenticated
  with check (
    invited_by = (select auth.uid())
    and expires_at > now()
    and expires_at < now() + interval '30 days'
    and (
      (renoxis_private.member_role(brokerage_id) = 'owner')
      or (renoxis_private.member_role(brokerage_id) = 'broker' and role in ('agent', 'assistant'))
    )
  );

-- Personal rows stay on renoxis_owner. This boundary stops a member from writing another office.
drop policy if exists renoxis_team_boundary on public.renoxis_records;
create policy renoxis_team_boundary on public.renoxis_records
  as restrictive
  for all to authenticated
  using (
    brokerage_id is null
    or renoxis_private.can_read_record(brokerage_id, owner_agent_id, visibility, user_id)
  )
  with check (
    brokerage_id is null
    or (
      user_id = (select auth.uid())
      and renoxis_private.member_role(brokerage_id) is not null
      and (
        renoxis_private.member_role(brokerage_id) in ('owner', 'broker')
        or (owner_agent_id = (select auth.uid()) and visibility in ('book', 'private'))
      )
    )
  );
drop policy if exists renoxis_team_read on public.renoxis_records;
create policy renoxis_team_read on public.renoxis_records
  for select to authenticated
  using (
    brokerage_id is not null
    and renoxis_private.can_read_record(brokerage_id, owner_agent_id, visibility, user_id)
  );

drop policy if exists renoxis_note_read on public.renoxis_notes;
create policy renoxis_note_read on public.renoxis_notes
  for select to authenticated
  using (renoxis_private.can_read_note(brokerage_id, author_id, shared));
drop policy if exists renoxis_note_insert on public.renoxis_notes;
create policy renoxis_note_insert on public.renoxis_notes
  for insert to authenticated
  with check (author_id = (select auth.uid()) and renoxis_private.member_role(brokerage_id) is not null);
drop policy if exists renoxis_note_update on public.renoxis_notes;
create policy renoxis_note_update on public.renoxis_notes
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists renoxis_ledger_read on public.brokerage_ixis_ledger;
create policy renoxis_ledger_read on public.brokerage_ixis_ledger
  for select to authenticated
  using (renoxis_private.member_role(brokerage_id) in ('owner', 'broker'));

drop policy if exists renoxis_commission_read on public.platform_commission;
create policy renoxis_commission_read on public.platform_commission
  for select to authenticated
  using (renoxis_private.member_role(brokerage_id) is not null);

drop policy if exists renoxis_outbox_read on public.renoxis_outbox;
create policy renoxis_outbox_read on public.renoxis_outbox
  for select to authenticated
  using (
    renoxis_private.member_role(brokerage_id) in ('owner', 'broker')
    or author_id = (select auth.uid())
  );
drop policy if exists renoxis_outbox_insert on public.renoxis_outbox;
create policy renoxis_outbox_insert on public.renoxis_outbox
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and approved = false
    and status = 'draft'
    and provider = 'not_configured'
    and renoxis_private.member_role(brokerage_id) is not null
  );
drop policy if exists renoxis_outbox_author on public.renoxis_outbox;
create policy renoxis_outbox_author on public.renoxis_outbox
  for update to authenticated
  using (author_id = (select auth.uid()) and approved = false)
  with check (author_id = (select auth.uid()) and approved = false and status in ('draft', 'pending_approve'));
drop policy if exists renoxis_outbox_approver on public.renoxis_outbox;
create policy renoxis_outbox_approver on public.renoxis_outbox
  for update to authenticated
  using (renoxis_private.member_role(brokerage_id) in ('owner', 'broker'))
  with check (
    renoxis_private.member_role(brokerage_id) in ('owner', 'broker')
    and status in ('draft', 'pending_approve', 'approved', 'rejected')
    and provider in ('not_configured', 'blocked')
  );
