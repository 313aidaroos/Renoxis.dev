-- Property lookup currently saves the facts the agent typed; it queries no property-data source.
-- Charging 25 Ixis for that is not defensible. Free until a real lookup exists.
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
