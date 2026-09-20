create table public.renoxis_ai_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create index renoxis_ai_requests_owner_time on public.renoxis_ai_requests(user_id,created_at);
alter table public.renoxis_ai_requests enable row level security;
revoke all on public.renoxis_ai_requests from anon,authenticated;
grant select on public.renoxis_ai_requests to authenticated;
grant insert(user_id) on public.renoxis_ai_requests to authenticated;
create policy renoxis_ai_read on public.renoxis_ai_requests for select to authenticated using((select auth.uid())=user_id);
create policy renoxis_ai_insert on public.renoxis_ai_requests for insert to authenticated with check((select auth.uid())=user_id);
create function public.renoxis_take_ai_slot() returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare uid uuid := auth.uid();
begin
 if uid is null then return false; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,17));
 if (select count(*) from public.renoxis_ai_requests where user_id=uid and created_at>now()-interval '1 minute')>=10 then return false; end if;
 if (select count(*) from public.renoxis_ai_requests where user_id=uid and created_at>now()-interval '1 day')>=100 then return false; end if;
 insert into public.renoxis_ai_requests(user_id) values(uid);
 return true;
end $$;
revoke all on function public.renoxis_take_ai_slot() from public,anon;
grant execute on function public.renoxis_take_ai_slot() to authenticated;
