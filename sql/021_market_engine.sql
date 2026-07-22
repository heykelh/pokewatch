-- ============================================================
-- Moteur de detection sur le Price Guide (source fraiche, 22 000 cartes).
-- L'ancien moteur tournait sur TCGdex, dont les prix sont perimes
-- (constat du 14/07 : prix identiques plusieurs jours alors que
-- le Price Guide bougeait). Migration en parallele : nouveau moteur,
-- nouvelle table, ancien conserve jusqu'a validation.
-- ============================================================

create table if not exists market_anomalies (
  id_product int not null,
  detected_date date not null,
  rule text not null,
  severity numeric,
  details jsonb,
  status text default 'nouveau',
  created_at timestamptz default now(),
  primary key (id_product, detected_date, rule)
);

create index if not exists idx_market_ano_date on market_anomalies (detected_date desc);
alter table market_anomalies enable row level security;
create policy "public_read_market_anomalies" on market_anomalies for select using (true);

-- Vue materialisee etendue : moyennes mobiles calculees sur NOTRE historique
drop materialized view if exists mv_market_daily cascade;

create materialized view mv_market_daily as
select
  id_product,
  snapshot_date,
  trend,
  low,
  lag(trend) over w as prev_trend,
  lag(low) over w as prev_low,
  case when lag(trend) over w > 0
       then (trend - lag(trend) over w) / lag(trend) over w end as daily_return,
  count(*) over (partition by id_product order by snapshot_date
                 rows between unbounded preceding and current row) as history_days,
  avg(trend) over (partition by id_product order by snapshot_date
                   rows between 6 preceding and current row) as ma7,
  avg(trend) over (partition by id_product order by snapshot_date
                   rows between 29 preceding and current row) as ma30,
  stddev(trend) over (partition by id_product order by snapshot_date
                      rows between 29 preceding and current row) as std30
from v_market_clean
where is_trustworthy
window w as (partition by id_product order by snapshot_date);

create unique index on mv_market_daily (id_product, snapshot_date);
create index on mv_market_daily (snapshot_date);

create view v_market_daily as
select snapshot_date, count(*) as cards,
       percentile_cont(0.5) within group (order by daily_return) as median_return,
       percentile_cont(0.9) within group (order by daily_return) as p90_return
from mv_market_daily where daily_return is not null
group by snapshot_date;

create view v_market_movers as
select m.id_product, p.name, m.snapshot_date, m.trend, m.prev_trend,
       m.daily_return, d.median_return as market_return,
       m.daily_return - d.median_return as excess_return, m.history_days
from mv_market_daily m
left join market_products p on p.id_product = m.id_product
join v_market_daily d on d.snapshot_date = m.snapshot_date
where m.daily_return is not null
  and m.daily_return between -0.8 and 0.8
  and m.prev_trend >= 5;

create or replace view v_market_pulse as
select d.snapshot_date, d.cards as cards_analysees,
       round(d.median_return::numeric, 4) as median_return,
       round(d.p90_return::numeric, 4) as p90_return,
       q.total as cartes_scannees, q.fiables, q.pct_fiable
from v_market_daily d join v_data_quality q on q.snapshot_date = d.snapshot_date;

create or replace function refresh_market_views()
returns void language sql security definer as $$
  refresh materialized view concurrently mv_market_daily;
$$;

-- Parametres du nouveau moteur
insert into detection_config (key, value, description) values
  ('m_min_trend',      5.0,  'Prix minimum pour analyse (rationalite economique)'),
  ('m_ma_ratio',       1.25, 'R2b: trend / moyenne mobile 7j declenchant'),
  ('m_ma_confirm',     1.08, 'R2b: ma7 / ma30 confirmant la tendance'),
  ('m_ma_min_days',    7,    'R2b: historique minimum'),
  ('m_zscore',         3.0,  'R4: ecart-types au-dela desquels alerter'),
  ('m_z_min_days',     14,   'R4: historique minimum'),
  ('m_excess',         0.15, 'R7: ecart au marche minimum (15 points)'),
  ('m_low_jump',       1.5,  'R3b: bond du plancher'),
  ('m_wave_min',       3,    'R5b/R6b: cartes minimum pour une vague')
on conflict (key) do nothing;

-- ============================================================
create or replace function run_market_detection(p_date date default current_date)
returns table(rule_name text, detections bigint)
language plpgsql security definer
as $$
declare
  c_min numeric := (select value from detection_config where key='m_min_trend');
  c_ma  numeric := (select value from detection_config where key='m_ma_ratio');
  c_mac numeric := (select value from detection_config where key='m_ma_confirm');
  c_mad numeric := (select value from detection_config where key='m_ma_min_days');
  c_z   numeric := (select value from detection_config where key='m_zscore');
  c_zd  numeric := (select value from detection_config where key='m_z_min_days');
  c_ex  numeric := (select value from detection_config where key='m_excess');
  c_lj  numeric := (select value from detection_config where key='m_low_jump');
  c_w   numeric := (select value from detection_config where key='m_wave_min');
  v_med numeric := (select median_return from v_market_daily where snapshot_date = p_date);
begin

  -- R2b : le prix decroche de SA PROPRE moyenne mobile 7 jours,
  -- confirmee par la moyenne 30 jours. Remplace l'ancienne R2 (moyennes
  -- de la source, figees). Ici les moyennes sont calculees par nous.
  insert into market_anomalies (id_product, detected_date, rule, severity, details)
  select m.id_product, m.snapshot_date, 'trend_ma_divergence',
         round((m.trend / nullif(m.ma7,0))::numeric, 2),
         jsonb_build_object(
           'trend', m.trend, 'ma7', round(m.ma7::numeric,2), 'ma30', round(m.ma30::numeric,2),
           'history_days', m.history_days,
           'reading', 'Le prix de reference decroche de sa moyenne des 7 derniers jours, et la tendance est confirmee sur 30 jours. Moyennes calculees sur notre propre historique.')
  from mv_market_daily m
  where m.snapshot_date = p_date
    and m.trend >= c_min
    and m.history_days >= c_mad
    and m.ma7 > 0 and m.ma30 > 0
    and m.trend > m.ma7 * c_ma
    and m.ma7 > m.ma30 * c_mac
  on conflict do nothing;
  rule_name := 'R2b_trend_ma_divergence';
  select count(*) into detections from market_anomalies where detected_date=p_date and rule='trend_ma_divergence';
  return next;

  -- R4 : variation anormale au regard de la volatilite propre de la carte
  insert into market_anomalies (id_product, detected_date, rule, severity, details)
  select m.id_product, m.snapshot_date, 'trend_zscore',
         round((abs(m.trend - m.ma30) / nullif(m.std30,0))::numeric, 2),
         jsonb_build_object(
           'trend', m.trend, 'ma30', round(m.ma30::numeric,2),
           'std30', round(m.std30::numeric,2), 'history_days', m.history_days,
           'reading', 'Variation anormale au regard de la volatilite habituelle de cette carte.')
  from mv_market_daily m
  where m.snapshot_date = p_date
    and m.trend >= c_min
    and m.history_days >= c_zd
    and m.std30 > 0
    and abs(m.trend - m.ma30) / m.std30 > c_z
  on conflict do nothing;
  rule_name := 'R4_trend_zscore';
  select count(*) into detections from market_anomalies where detected_date=p_date and rule='trend_zscore';
  return next;

  -- R7 : divergence au marche. Une carte ne compte que si elle s'ecarte
  -- du mouvement d'ensemble. C'est la distinction entre "le marche monte"
  -- et "cette carte decroche".
  insert into market_anomalies (id_product, detected_date, rule, severity, details)
  select v.id_product, v.snapshot_date, 'market_divergence',
         round((v.excess_return * 100)::numeric, 1),
         jsonb_build_object(
           'trend', v.trend, 'prev_trend', v.prev_trend,
           'change_pct', round((v.daily_return*100)::numeric,1),
           'market_pct', round((v.market_return*100)::numeric,2),
           'excess_pct', round((v.excess_return*100)::numeric,1),
           'reading', 'La carte s''ecarte nettement du mouvement median du marche. Un mouvement d''un seul jour n''est pas concluant : seule la persistance donne du sens.')
  from v_market_movers v
  where v.snapshot_date = p_date
    and v.trend >= c_min
    and v.excess_return > c_ex
  on conflict do nothing;
  rule_name := 'R7_market_divergence';
  select count(*) into detections from market_anomalies where detected_date=p_date and rule='market_divergence';
  return next;

  -- R3b : bond du plancher. SIGNAL FAIBLE : le plancher agrege les etats
  -- de conservation, ce bond peut refleter la vente de l'exemplaire abime.
  insert into market_anomalies (id_product, detected_date, rule, severity, details)
  select m.id_product, m.snapshot_date, 'low_jump',
         round((m.low / nullif(m.prev_low,0))::numeric, 2),
         jsonb_build_object(
           'low', m.low, 'prev_low', m.prev_low, 'trend', m.trend,
           'reading', 'Le prix plancher a bondi en 24h. Signal faible : le plancher agrege les etats de conservation, ce mouvement peut simplement traduire la vente de l''exemplaire le plus abime.')
  from mv_market_daily m
  where m.snapshot_date = p_date
    and m.trend >= c_min
    and m.prev_low > 0
    and m.low >= m.prev_low * c_lj
    and m.low <= m.trend * 3
  on conflict do nothing;
  rule_name := 'R3b_low_jump';
  select count(*) into detections from market_anomalies where detected_date=p_date and rule='low_jump';
  return next;

  -- R5b : vague intra-extension (contexte)
  insert into market_anomalies (id_product, detected_date, rule, severity, details)
  select a.id_product, p_date, 'set_wave', w.n,
         jsonb_build_object('id_expansion', pr.id_expansion, 'cards_flagged', w.n,
           'reading', 'Plusieurs cartes de la meme extension signalees le meme jour : coordination possible, ou engouement pour l''extension.')
  from market_anomalies a
  join market_products pr on pr.id_product = a.id_product
  join (
    select pr2.id_expansion, count(distinct a2.id_product) as n
    from market_anomalies a2 join market_products pr2 on pr2.id_product = a2.id_product
    where a2.detected_date = p_date and a2.rule not in ('set_wave','pokemon_wave')
    group by pr2.id_expansion having count(distinct a2.id_product) >= c_w
  ) w on w.id_expansion = pr.id_expansion
  where a.detected_date = p_date and a.rule not in ('set_wave','pokemon_wave')
  on conflict do nothing;
  rule_name := 'R5b_set_wave';
  select count(*) into detections from market_anomalies where detected_date=p_date and rule='set_wave';
  return next;

  -- R6b : vague intra-Pokemon (nee de l'investigation Ectoplasma).
  -- Le nom Cardmarket est de la forme "Gengar [Attaque | Attaque]" :
  -- on isole la partie avant le crochet.
  insert into market_anomalies (id_product, detected_date, rule, severity, details)
  select a.id_product, p_date, 'pokemon_wave', w.n,
         jsonb_build_object('pokemon', split_part(pr.name, ' [', 1), 'cards_flagged', w.n,
           'reading', 'Plusieurs cartes du meme Pokemon signalees le meme jour. Peut indiquer une coordination, ou au contraire un engouement legitime pour le personnage.')
  from market_anomalies a
  join market_products pr on pr.id_product = a.id_product
  join (
    select split_part(pr2.name, ' [', 1) as poke, count(distinct a2.id_product) as n
    from market_anomalies a2 join market_products pr2 on pr2.id_product = a2.id_product
    where a2.detected_date = p_date and a2.rule not in ('set_wave','pokemon_wave')
    group by 1 having count(distinct a2.id_product) >= c_w
  ) w on w.poke = split_part(pr.name, ' [', 1)
  where a.detected_date = p_date and a.rule not in ('set_wave','pokemon_wave')
  on conflict do nothing;
  rule_name := 'R6b_pokemon_wave';
  select count(*) into detections from market_anomalies where detected_date=p_date and rule='pokemon_wave';
  return next;

end;
$$;

notify pgrst, 'reload schema';
