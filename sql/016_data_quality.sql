-- ============================================================
-- Controle de plausibilite sur le prix de reference.
--
-- CONSTAT : environ 2,3 % du catalogue (500 cartes/jour) presente un trend
-- incoherent avec le prix moyen de ses ventes reelles.
-- Cas d'ecole : Murkrow (id_product 275337), trend passe de 7,17 EUR a
-- 273,81 EUR alors que son plancher reste a 1,50 EUR et son prix moyen a
-- 7,00 EUR. La valeur persiste plusieurs jours : ce n'est pas un mouvement
-- de marche, c'est une donnee corrompue.
--
-- DECISION : un trend n'est exploitable que s'il est coherent avec avg.
-- Les valeurs implausibles sont ECARTEES du calcul, jamais signalees
-- comme anomalies de marche.
-- ============================================================

create or replace view v_market_clean as
select
  id_product,
  snapshot_date,
  trend,
  low,
  avg,
  case
    when avg is null or avg <= 0 then 'avg_absent'
    when trend / avg > 3   then 'trend_implausible_haut'
    when trend / avg < 0.3 then 'trend_implausible_bas'
    else 'ok'
  end as quality_flag,
  (avg is not null and avg > 0 and trend / avg between 0.3 and 3) as is_trustworthy
from market_snapshots
where trend is not null;

-- Les vues d'analyse ne travaillent que sur des donnees jugees fiables
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
from v_market_clean
where is_trustworthy
window
  w_order as (partition by id_product order by snapshot_date),
  w_all   as (partition by id_product order by snapshot_date rows between unbounded preceding and current row),
  w7      as (partition by id_product order by snapshot_date rows between 6 preceding and current row),
  w30     as (partition by id_product order by snapshot_date rows between 29 preceding and current row);

-- Indicateur de qualite des donnees : mesurable, historise, publiable
create or replace view v_data_quality as
select
  snapshot_date,
  count(*) as total,
  count(*) filter (where quality_flag = 'ok') as fiables,
  count(*) filter (where quality_flag = 'trend_implausible_haut') as trend_trop_haut,
  count(*) filter (where quality_flag = 'trend_implausible_bas') as trend_trop_bas,
  count(*) filter (where quality_flag = 'avg_absent') as avg_absent,
  round(100.0 * count(*) filter (where quality_flag = 'ok') / count(*), 2) as pct_fiable
from v_market_clean
group by snapshot_date;