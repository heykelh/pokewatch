-- Les cartes signalees par le scan large entrent automatiquement
-- en investigation approfondie. La watchlist cesse d'etre un choix arbitraire.
create or replace function promote_flagged_to_watchlist(p_date date default current_date)
returns int
language plpgsql
security definer
as $$
declare
  promoted int := 0;
begin
  -- Les produits Cardmarket signales aujourd'hui, non deja en watchlist
  with flagged as (
    select distinct m.id_product
    from v_market_trend_ma m
    where m.snapshot_date = p_date
      and m.daily_return is not null
      and abs(m.daily_return) between 0.15 and 0.80   -- plausible, non artefactuel
      and m.trend >= 20                                -- enjeu suffisant
  )
  update cards c
  set watchlist = true
  from flagged f
  where c.cm_id_product = f.id_product::text
    and c.watchlist = false;

  get diagnostics promoted = row_count;

  insert into watchlist_log (card_id, reason)
  select c.id, 'promue par le scan large (mouvement de ' || p_date || ')'
  from cards c
  where c.watchlist = true
    and not exists (
      select 1 from watchlist_log wl
      where wl.card_id = c.id and wl.added_date = current_date
    )
    and c.cm_id_product in (
      select id_product::text from v_market_trend_ma
      where snapshot_date = p_date and abs(daily_return) between 0.15 and 0.80
    );

  return promoted;
end;
$$;

notify pgrst, 'reload schema';