-- Prix TCGplayer (USD) : deuxieme source, deja presente dans les reponses TCGdex.
-- Interet : le lowPrice TCGplayer n'agrege PAS les etats abimes comme le fait
-- le low Cardmarket. Permet le controle croise et la divergence inter-marches.
alter table cm_price_snapshots add column if not exists tcgp_variant text;
alter table cm_price_snapshots add column if not exists tcgp_low numeric;
alter table cm_price_snapshots add column if not exists tcgp_mid numeric;
alter table cm_price_snapshots add column if not exists tcgp_high numeric;
alter table cm_price_snapshots add column if not exists tcgp_market numeric;
alter table cm_price_snapshots add column if not exists tcgp_direct_low numeric;

-- Vue : variation quotidienne sur chaque marche, et leur ecart.
-- On ne compare JAMAIS les niveaux (EUR vs USD), uniquement les variations.
create or replace view v_dual_market as
select
  card_id,
  snapshot_date,
  trend as cm_trend,
  tcgp_market,
  lag(trend) over w as prev_cm_trend,
  lag(tcgp_market) over w as prev_tcgp_market,
  case when lag(trend) over w > 0
       then (trend - lag(trend) over w) / lag(trend) over w end as cm_return,
  case when lag(tcgp_market) over w > 0
       then (tcgp_market - lag(tcgp_market) over w) / lag(tcgp_market) over w end as tcgp_return
from cm_price_snapshots
where source = 'tcgdex'
window w as (partition by card_id order by snapshot_date);

notify pgrst, 'reload schema';