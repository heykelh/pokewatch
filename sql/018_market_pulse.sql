-- Le pouls du marche : la reference contre laquelle tout mouvement se juge.
create or replace view v_market_pulse as
select
  d.snapshot_date,
  d.cards as cards_analysees,
  round(d.median_return::numeric, 4) as median_return,
  round(d.p90_return::numeric, 4) as p90_return,
  q.total as cartes_scannees,
  q.fiables,
  q.pct_fiable
from v_market_daily d
join v_data_quality q on q.snapshot_date = d.snapshot_date;

-- Les movers, exprimes en ECART AU MARCHE (pas en variation brute)
create or replace view v_market_movers as
select
  m.id_product,
  p.name,
  m.snapshot_date,
  m.trend,
  m.prev_trend,
  m.daily_return,
  d.median_return as market_return,
  m.daily_return - d.median_return as excess_return,   -- <<< le vrai signal
  m.history_days
from v_market_trend_ma m
left join market_products p on p.id_product = m.id_product
join v_market_daily d on d.snapshot_date = m.snapshot_date
where m.daily_return is not null
  and m.daily_return between -0.8 and 0.8   -- plafond de plausibilite
  and m.prev_trend >= 5;

notify pgrst, 'reload schema';