-- entitlement_kind.sql
-- The Activate redeem writes a renoxis_records row with kind='entitlement' (a cache of the
-- Wallet's entitlement, for fast server-side seat gating). The kind CHECK never allowed it,
-- so every successful Wallet reserve was immediately released and the customer saw a 500.
-- Verified live 2026-09-22. Adds the kind; nothing else changes.
alter table public.renoxis_records drop constraint if exists renoxis_records_kind_check;
alter table public.renoxis_records add constraint renoxis_records_kind_check
  check (kind = any (array['lead','client','property','transaction','task','event','renovation','social','document','draft','settings','entitlement']));
