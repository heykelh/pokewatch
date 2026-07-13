-- Detecteur de jours manquants : le systeme surveille sa propre assiduite.
create or replace view v_missing_days as
select d::date as jour_manquant
from generate_series(
  (select min(snapshot_date) from market_snapshots),
  current_date - 1,          -- on n'exige pas le jour en cours
  '1 day'::interval
) d
where d::date not in (select distinct snapshot_date from market_snapshots);

-- Sante globale du pipeline, en une ligne
create or replace view v_pipeline_health as
select
  (select min(snapshot_date) from market_snapshots) as premier_jour,
  (select max(snapshot_date) from market_snapshots) as dernier_jour,
  (select count(distinct snapshot_date) from market_snapshots) as jours_collectes,
  (select count(*) from v_missing_days) as jours_manquants,
  (select count(*) from market_snapshots
   where snapshot_date = (select max(snapshot_date) from market_snapshots)) as cartes_dernier_jour;

notify pgrst, 'reload schema';