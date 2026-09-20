-- Renoxis only. No existing auth users or other application tables are changed.
create table if not exists public.renoxis_records (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('lead','client','property','transaction','task','event','renovation','social','document','draft','settings')),
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<50000),
 version integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists renoxis_records_owner on public.renoxis_records(user_id,kind);
create unique index if not exists renoxis_one_settings on public.renoxis_records(user_id) where kind='settings';
alter table public.renoxis_records enable row level security;
revoke all on public.renoxis_records from anon, authenticated;
grant select,insert,update,delete on public.renoxis_records to authenticated;
create policy renoxis_owner on public.renoxis_records for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create table if not exists public.renoxis_connections (
 user_id uuid primary key references auth.users(id) on delete cascade,
 provider text not null default 'google' check(provider='google'),
 email text not null,
 encrypted_tokens text not null,
 scopes text not null,
 updated_at timestamptz not null default now()
);
alter table public.renoxis_connections enable row level security;
revoke all on public.renoxis_connections from anon,authenticated;
-- Token access is server-only, via service role; never expose encrypted token blobs to clients.
grant all on public.renoxis_connections to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('renoxis-documents','renoxis-documents',false,10485760,array['application/pdf','image/png','image/jpeg','text/plain']) on conflict(id) do nothing;
create policy renoxis_document_read on storage.objects for select to authenticated using (bucket_id='renoxis-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy renoxis_document_insert on storage.objects for insert to authenticated with check(bucket_id='renoxis-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy renoxis_document_delete on storage.objects for delete to authenticated using (bucket_id='renoxis-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
