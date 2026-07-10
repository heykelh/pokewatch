-- ============================================================
-- PokéWatch — Moteur de détection d'anomalies (Phase 2)
-- Toute la logique de détection vit ici : auditable, versionnée.
-- ============================================================

-- Seuils de détection : en base, ajustables sans redéploiement,
-- chaque calibration est traçable.
create table if not exists detection_config (
  key text primary key,
  value numeric not null,
  description text,
  updated_at timestamptz default now()
);

insert into detection_config (key, value, description) values
  ('min_trend_eur',        20,   'Prix trend minimum pour être analysé (cible de buyout rentable)'),
  ('r1_low_trend_ratio',   1.30, 'R1: low > trend * ratio => plancher nettoyé'),
  ('r2_avg1_avg30_ratio',  1.40, 'R2: avg1 > avg30 * ratio => pump en cours'),
  ('r3_low_jump_ratio',    1.50, 'R3: low >= prev_low * ratio en 1 jour'),
  ('r3_trend_stable_pct',  0.15, 'R3: le trend ne doit pas avoir bougé de plus de 15%'),
  ('r4_zscore_threshold',  3.0,  'R4: |z-score| du retour quotidien du trend'),
  ('r4_min_history_days',  14,   'R4: historique minimum avant activation'),
  ('r5_set_wave_min',      3,    'R5: nb min de cartes flaggées même set même jour')
on conflict (key) do nothing;

-- Vue : chaque snapshot avec son précédent (deltas jour/jour)
create or replace view v_price_deltas as
select
  s.card_id,
  s.snapshot_date,
  s.trend, s.low, s.avg1, s.avg7, s.avg30,
  lag(s.trend) over w as prev_trend,
  lag(s.low)   over w as prev_low,
  lag(s.snapshot_date) over w as prev_date
from cm_price_snapshots s
where s.source = 'tcgdex'
window w as (partition by s.card_id order by s.snapshot_date);

-- Vue : statistiques de volatilité propres à chaque carte (pour R4)
create or replace view v_card_volatility as
select
  card_id,
  count(*) as history_days,
  avg(daily_return)    as mean_return,
  stddev(daily_return) as std_return
from (
  select card_id, snapshot_date,
         (trend - lag(trend) over (partition by card_id order by snapshot_date))
         / nullif(lag(trend) over (partition by card_id order by snapshot_date), 0)
         as daily_return
  from cm_price_snapshots
  where source = 'tcgdex'
) r
where daily_return is not null
group by card_id;

-- ============================================================
-- Fonction de détection : exécute les 5 règles pour une date,
-- insère dans `anomalies` (idempotent), retourne le bilan.
-- ============================================================
create or replace function run_detection(p_date date default current_date)
returns table(rule_name text, detections bigint)
language plpgsql
as $$
declare
  cfg_min_trend numeric := (select value from detection_config where key = 'min_trend_eur');
  cfg_r1 numeric := (select value from detection_config where key = 'r1_low_trend_ratio');
  cfg_r2 numeric := (select value from detection_config where key = 'r2_avg1_avg30_ratio');
  cfg_r3 numeric := (select value from detection_config where key = 'r3_low_jump_ratio');
  cfg_r3_stable numeric := (select value from detection_config where key = 'r3_trend_stable_pct');
  cfg_r4_z numeric := (select value from detection_config where key = 'r4_zscore_threshold');
  cfg_r4_days numeric := (select value from detection_config where key = 'r4_min_history_days');
  cfg_r5_min numeric := (select value from detection_config where key = 'r5_set_wave_min');
begin

  -- R1 : plancher au-dessus du trend (fond de marché nettoyé)
  insert into anomalies (card_id, detected_date, rule, severity, details)
  select d.card_id, d.snapshot_date, 'low_above_trend',
         round(d.low / d.trend, 2),
         jsonb_build_object(
           'low', d.low, 'trend', d.trend,
           'ratio', round(d.low / d.trend, 2), 'threshold', cfg_r1,
           'reading', 'Le prix plancher dépasse le trend : les listings bon marché ont disparu.')
  from v_price_deltas d
  where d.snapshot_date = p_date
    and d.trend >= cfg_min_trend
    and d.low > d.trend * cfg_r1
  on conflict (card_id, detected_date, rule) do nothing;
  rule_name := 'R1_low_above_trend';
  select count(*) into detections from anomalies
    where detected_date = p_date and rule = 'low_above_trend';
  return next;

  -- R2 : divergence ventes du jour vs moyenne 30 jours (pump)
  insert into anomalies (card_id, detected_date, rule, severity, details)
  select d.card_id, d.snapshot_date, 'avg1_divergence',
         round(d.avg1 / d.avg30, 2),
         jsonb_build_object(
           'avg1', d.avg1, 'avg30', d.avg30,
           'ratio', round(d.avg1 / d.avg30, 2), 'threshold', cfg_r2,
           'reading', 'Les ventes du jour décrochent fortement de la moyenne 30 jours.')
  from v_price_deltas d
  where d.snapshot_date = p_date
    and d.trend >= cfg_min_trend
    and d.avg30 > 0 and d.avg1 > d.avg30 * cfg_r2
  on conflict (card_id, detected_date, rule) do nothing;
  rule_name := 'R2_avg1_divergence';
  select count(*) into detections from anomalies
    where detected_date = p_date and rule = 'avg1_divergence';
  return next;

  -- R3 : saut du plancher avec trend stable (signature buyout)
  insert into anomalies (card_id, detected_date, rule, severity, details)
  select d.card_id, d.snapshot_date, 'low_jump',
         round(d.low / d.prev_low, 2),
         jsonb_build_object(
           'low', d.low, 'prev_low', d.prev_low,
           'jump_ratio', round(d.low / d.prev_low, 2),
           'trend_change_pct', round(abs(d.trend - d.prev_trend) / nullif(d.prev_trend, 0), 3),
           'threshold', cfg_r3,
           'reading', 'Le plancher a sauté en 24h sans mouvement du trend : achat massif probable des listings les moins chers.')
  from v_price_deltas d
  where d.snapshot_date = p_date
    and d.trend >= cfg_min_trend
    and d.prev_low > 0 and d.low >= d.prev_low * cfg_r3
    and d.prev_trend > 0
    and abs(d.trend - d.prev_trend) / d.prev_trend < cfg_r3_stable
  on conflict (card_id, detected_date, rule) do nothing;
  rule_name := 'R3_low_jump';
  select count(*) into detections from anomalies
    where detected_date = p_date and rule = 'low_jump';
  return next;

  -- R4 : z-score du retour quotidien (activé si historique suffisant)
  insert into anomalies (card_id, detected_date, rule, severity, details)
  select d.card_id, d.snapshot_date, 'trend_zscore',
         round(abs((d.trend - d.prev_trend) / nullif(d.prev_trend, 0) - v.mean_return)
               / nullif(v.std_return, 0), 2),
         jsonb_build_object(
           'daily_return', round((d.trend - d.prev_trend) / nullif(d.prev_trend, 0), 4),
           'card_mean_return', round(v.mean_return, 4),
           'card_std_return', round(v.std_return, 4),
           'history_days', v.history_days, 'threshold', cfg_r4_z,
           'reading', 'Variation quotidienne anormale par rapport à la volatilité historique propre de cette carte.')
  from v_price_deltas d
  join v_card_volatility v on v.card_id = d.card_id
  where d.snapshot_date = p_date
    and d.trend >= cfg_min_trend
    and v.history_days >= cfg_r4_days
    and v.std_return > 0
    and d.prev_trend > 0
    and abs((d.trend - d.prev_trend) / d.prev_trend - v.mean_return) / v.std_return > cfg_r4_z
  on conflict (card_id, detected_date, rule) do nothing;
  rule_name := 'R4_trend_zscore';
  select count(*) into detections from anomalies
    where detected_date = p_date and rule = 'trend_zscore';
  return next;

  -- R5 : vague coordonnée intra-set (méta-règle sur R1-R4 du jour)
  insert into anomalies (card_id, detected_date, rule, severity, details)
  select a.card_id, p_date, 'set_wave',
         set_counts.n,
         jsonb_build_object(
           'set_id', c.set_id, 'cards_flagged_in_set', set_counts.n,
           'threshold', cfg_r5_min,
           'reading', 'Plusieurs cartes du même set flaggées le même jour : coordination possible.')
  from anomalies a
  join cards c on c.id = a.card_id
  join (
    select c2.set_id, count(distinct a2.card_id) as n
    from anomalies a2
    join cards c2 on c2.id = a2.card_id
    where a2.detected_date = p_date and a2.rule <> 'set_wave'
    group by c2.set_id
    having count(distinct a2.card_id) >= cfg_r5_min
  ) set_counts on set_counts.set_id = c.set_id
  where a.detected_date = p_date and a.rule <> 'set_wave'
  on conflict (card_id, detected_date, rule) do nothing;
  rule_name := 'R5_set_wave';
  select count(*) into detections from anomalies
    where detected_date = p_date and rule = 'set_wave';
  return next;

end;
$$;