-- La colonne avg est deja dans market_snapshots (on l'ingere depuis le debut).
-- On ajoute les avg figes pour pouvoir MESURER leur frequence de mise a jour
-- dans le temps (7j, 14j, 30j) sans avoir a retelecharger quoi que ce soit.
alter table market_snapshots add column if not exists avg1 numeric;
alter table market_snapshots add column if not exists avg7 numeric;
alter table market_snapshots add column if not exists avg30 numeric;

-- ============================================================
-- Moyennes mobiles calculees sur NOTRE historique.
-- Elles retournent null tant que l'historique est insuffisant,
-- et se remplissent toutes seules jour apres jour.
-- ============================================================
create or replace view v_market_trend_ma as
select
  id_product,
  snapshot_date,
  trend,
  low,
  count(*) over w_all as history_days,
  avg(trend) over w7  as trend_ma7,
  avg(trend) over w30 as trend_ma30,
  stddev(trend) over w30 as trend_std30,
  lag(trend) over w_order as prev_trend,
  case
    when lag(trend) over w_order > 0
    then (trend - lag(trend) over w_order) / lag(trend) over w_order
  end as daily_return
from market_snapshots
window
  w_order as (partition by id_product order by snapshot_date),
  w_all   as (partition by id_product order by snapshot_date rows between unbounded preceding and current row),
  w7      as (partition by id_product order by snapshot_date rows between 6 preceding and current row),
  w30     as (partition by id_product order by snapshot_date rows between 29 preceding and current row);

-- Mouvement median du marche par jour : la base de la future regle
-- de divergence (distinguer "le marche monte" de "cette carte decroche").
create or replace view v_market_daily as
select
  snapshot_date,
  count(*) as cards,
  percentile_cont(0.5) within group (order by daily_return) as median_return,
  percentile_cont(0.9) within group (order by daily_return) as p90_return
from v_market_trend_ma
where daily_return is not null
group by snapshot_date;