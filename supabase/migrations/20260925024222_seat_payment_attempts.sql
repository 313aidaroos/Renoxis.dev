-- Stage each purchase durably; active access changes only after Wallet confirms capture.
-- Additive and service-role only. Existing paid seats are preserved.
begin;
create table if not exists public.renoxis_seat_attempts (
 user_id uuid not null references auth.users(id) on delete cascade,
 intent text not null check (intent in ('activate','monthly')),
 attempt_id text not null check (attempt_id ~ '^[A-Za-z0-9_-]{8,40}$'),
 reservation_id text not null unique,
 status text not null default 'pending' check (status in ('pending','complete','released')),
 base_version integer not null,
 activated_at timestamptz,
 seat_period_end timestamptz,
 receipt_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,intent,attempt_id)
);
create unique index if not exists renoxis_one_pending_seat_attempt on public.renoxis_seat_attempts(user_id) where status='pending';
alter table public.renoxis_seat_attempts enable row level security;
revoke all on public.renoxis_seat_attempts from public, anon, authenticated;
grant all on public.renoxis_seat_attempts to service_role;

create or replace function public.renoxis_stage_seat(p_user_id uuid,p_intent text,p_attempt_id text,p_reservation_id text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.renoxis_entitlements%rowtype; a public.renoxis_seat_attempts%rowtype; next_activation timestamptz; next_end timestamptz;
begin
 if p_intent is null or p_attempt_id is null or p_intent not in ('activate','monthly') or p_attempt_id !~ '^[A-Za-z0-9_-]{8,40}$' or nullif(p_reservation_id,'') is null then raise exception 'Invalid seat attempt'; end if;
 insert into public.renoxis_entitlements(user_id,source) values(p_user_id,'wallet_capture') on conflict(user_id) do nothing;
 select * into s from public.renoxis_entitlements where user_id=p_user_id for update;
 select * into a from public.renoxis_seat_attempts where user_id=p_user_id and intent=p_intent and attempt_id=p_attempt_id;
 if found then
  if a.reservation_id <> p_reservation_id then raise exception 'Reservation does not match attempt'; end if;
  if a.status='released' then return jsonb_build_object('error','RELEASED'); end if;
  return jsonb_build_object('status',a.status,'activatedAt',a.activated_at,'seatPeriodEnd',a.seat_period_end,'source','wallet_capture');
 end if;
 if exists(select 1 from public.renoxis_seat_attempts where user_id=p_user_id and status='pending') then return jsonb_build_object('error','PENDING'); end if;
 next_activation:=s.activated_at; next_end:=s.seat_period_end;
 if p_intent='activate' then
  if s.activated_at is not null then return jsonb_build_object('error','ALREADY_ACTIVATED'); end if;
  next_activation:=now();
 else
  if s.activated_at is null then return jsonb_build_object('error','ACTIVATE_FIRST'); end if;
  next_end:=greatest(now(),s.seat_period_end)+interval '720 hours';
 end if;
 insert into public.renoxis_seat_attempts(user_id,intent,attempt_id,reservation_id,base_version,activated_at,seat_period_end)
 values(p_user_id,p_intent,p_attempt_id,p_reservation_id,s.version,next_activation,next_end);
 return jsonb_build_object('status','pending','activatedAt',next_activation,'seatPeriodEnd',next_end,'source','wallet_capture');
end $$;

create or replace function public.renoxis_settle_seat(p_user_id uuid,p_intent text,p_attempt_id text,p_reservation_id text,p_captured boolean,p_receipt_id text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.renoxis_entitlements%rowtype; a public.renoxis_seat_attempts%rowtype;
begin
 if p_captured is null then raise exception 'Capture status required'; end if;
 select * into s from public.renoxis_entitlements where user_id=p_user_id for update;
 select * into a from public.renoxis_seat_attempts where user_id=p_user_id and intent=p_intent and attempt_id=p_attempt_id for update;
 if not found or a.reservation_id <> p_reservation_id then raise exception 'Unknown seat attempt'; end if;
 if a.status='complete' then
  -- A late failed response must never revoke a completed purchase.
  return jsonb_build_object('status','complete','activatedAt',s.activated_at,'seatPeriodEnd',s.seat_period_end,'source','wallet_capture','receiptId',a.receipt_id);
 end if;
 if a.status='released' then
  if p_captured then raise exception 'Released attempt requires reconciliation'; end if;
  return jsonb_build_object('status','released');
 end if;
 if p_captured then
  if nullif(p_receipt_id,'') is null then raise exception 'Capture receipt required'; end if;
  if s.version <> a.base_version then raise exception 'Seat changed; reconcile captured payment'; end if;
  update public.renoxis_entitlements set activated_at=a.activated_at,seat_period_end=a.seat_period_end,last_receipt_id=p_receipt_id,version=version+1,updated_at=now() where user_id=p_user_id;
  update public.renoxis_seat_attempts set status='complete',receipt_id=p_receipt_id,updated_at=now() where user_id=p_user_id and intent=p_intent and attempt_id=p_attempt_id;
  return jsonb_build_object('status','complete','activatedAt',a.activated_at,'seatPeriodEnd',a.seat_period_end,'source','wallet_capture','receiptId',p_receipt_id);
 end if;
 -- Release only this pending attempt. There is no active access to roll back.
 update public.renoxis_seat_attempts set status='released',updated_at=now() where user_id=p_user_id and intent=p_intent and attempt_id=p_attempt_id;
 return jsonb_build_object('status','released');
end $$;
revoke all on function public.renoxis_stage_seat(uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.renoxis_settle_seat(uuid,text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.renoxis_stage_seat(uuid,text,text,text) to service_role;
grant execute on function public.renoxis_settle_seat(uuid,text,text,text,boolean,text) to service_role;
commit;
