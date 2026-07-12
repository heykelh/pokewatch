-- ============================================================
-- PokéWatch — Calibration du moteur (post-baseline)
-- Baseline mesurée : précision 50%, rappel 100%, F1 0.67
-- Défaut identifié : R1 confond buyout et listing hors-marché.
-- ============================================================

-- Nouveaux paramètres (traçables, datés)
insert into detection_config (key, value, description) values
  ('r1_low_trend_max',    3.0,  'R1: ratio low/trend MAXIMUM. Au-dela, listing hors-marche, pas un buyout.'),
  ('r2_avg7_confirm',     1.15, 'R2: avg7 doit confirmer la tendance (avg7 > avg30 * ce ratio)'),
  ('r6_pokemon_wave_min', 3,    'R6: nb min de cartes du meme Pokemon signalees le meme jour')
on conflict (key) do nothing;

-- Vue : le nom de base du Pokémon, extrait du nom de carte.
-- "Mega Gengar ex" -> "gengar", "Gengar & Mimikyu GX" -> "gengar"
-- Heuristique volontairement simple et lisible : on retire les qualificatifs connus.
create or replace view v_card_pokemon as
select
  id as card_id,
  lower(
    trim(
      regexp_replace(
        regexp_replace(name, '\s*(&|\|).*$', ''),                    -- coupe apres & ou |
        '\y(mega|ex|gx|v|vmax|vstar|prime|star|delta|shining|dark|radiant|primal)\y', '', 'gi'
      )
    )
  ) as pokemon
from cards;

-- ============================================================
-- Moteur calibré
-- ============================================================
create or replace function run_detection(p_date date default current_date)
returns table(rule_name text, detections bigint)
language plpgsql
as $$
declare
  cfg_min_trend numeric := (select value from detection_config where key = 'min_trend_eur');
  cfg_r1_min numeric := (select value from detection_config where key = 'r1_low_trend_ratio');
  cfg_r1_max numeric := (select value from detection_config where key = 'r1_low_trend_max');
  cfg_r2 numeric := (select value from detection_config where key = 'r2_avg1_avg30_ratio');
  cfg_r2_confirm numeric := (select value from detection_config where key = 'r2_avg7_confirm');
  cfg_r3 numeric := (select value from detection_config where key = 'r3_low_jump_ratio');
  cfg_r3_stable numeric := (select value from detection_config where key = 'r3_trend_stable_pct');
  cfg_r4_z numeric := (select value from detection_config where key = 'r4_zscore_threshold');
  cfg_r4_days numeric := (select value from detection_config where key = 'r4_min_history_days');
  cfg_r5_min numeric := (select value from detection_config where key = 'r5_set_wave_min');
  cfg_r6_min numeric := (select value from detection_config where key = 'r6_pokemon_wave_min');
  cfg_quarantine numeric := (select value from detection_config where key = 'quarantine_days');
begin

  -- R1 : plancher au-dessus du trend, DANS UNE PLAGE PLAUSIBLE.
  -- Correctif calibration : un ratio > 3 ne decrit pas un buyout mais un
  -- listing hors-marche (cas Mew 554275 a 100 000 EUR, cas Pikachu ex5.5-5).
  -- Second garde-fou : la carte doit avoir des ventes reelles (avg7 renseigne).
  insert into anomalies (card_id, detected_date, rule, severity, details)
  select d.card_id, d.snapshot_date, 'low_above_trend',
         round(d.low / d.trend, 2),
         jsonb_build_object(
           'low', d.low, 'trend', d.trend,
           'ratio', round(d.low / d.trend, 2),
           'plage_min', cfg_r1_min, 'plage_max', cfg_r1_max,
           'reading', 'Le prix plancher depasse le prix de reference dans une proportion compatible avec un rachat des offres basses.')
  from v_price_deltas d
  where d.snapshot_date = p_date
    and d.trend >= cfg_min_trend
    and d.avg7 is not null and d.avg7 > 0          -- ventes reelles exigees
    and d.low > d.trend * cfg_r1_min
    and d.low <= d.trend * cfg_r1_max              -- plafond anti listing absurde
  on conflict (card_id, detected_date, rule) do nothing;
  rule_name := 'R1_low_above_trend';
  select count(*) into detections from anomalies where detected_date = p_date and rule = 'low_above_trend';
  return next;

  -- R2 : divergence des ventes du jour, CONFIRMEE A 7 JOURS.
  -- Correctif calibration : une vente isolee ne suffit plus ; la moyenne
  -- hebdomadaire doit corroborer la tendance.
  insert into anomalies (card_id, detected_date, rule, severity, details)
  select d.card_id, d.snapshot_date, 'avg1_divergence',
         round(d.avg1 / d.avg30, 2),
         jsonb_build_object(
           'avg1', d.avg1, 'avg7', d.avg7, 'avg30', d.avg30,
           'ratio', round(d.avg1 / d.avg30, 2), 'threshold', cfg_r2,
           'confirmation_avg7', round(d.avg7 / d.avg30, 2),
           'reading', 'Les ventes du jour decrochent de la moyenne mensuelle, et la moyenne 7 jours confirme la tendance.')
  from v_price_deltas d
  where d.snapshot_date = p_date
    and d.trend >= cfg_min_trend
    and d.avg30 > 0
    and d.avg1 > d.avg30 * cfg_r2
    and d.avg7 is not null
    and d.avg7 > d.avg30 * cfg_r2_confirm          -- confirmation hebdomadaire
  on conflict (card_id, detected_date, rule) do nothing;
  rule_name := 'R2_avg1_divergence';
  select count(*) into detections from anomalies where detected_date = p_date and rule = 'avg1_divergence';
  return next;

  -- R3 : saut du plancher avec trend stable (inchangee, elle fonctionne)
  insert into anomalies (card_id, detected_date, rule, severity, details)
  select d.card_id, d.snapshot_date, 'low_jump',
         round(d.low / d.prev_low, 2),
         jsonb_build_object(
           'low', d.low, 'prev_low', d.prev_low,
           'jump_ratio', round(d.low / d.prev_low, 2),
           'trend_change_pct', round(abs(d.trend - d.prev_trend) / nullif(d.prev_trend, 0), 3),
           'threshold', cfg_r3,
           'reading', 'Le plancher a bondi en 24h sans mouvement du prix de reference : achat massif probable des offres les moins cheres.')
  from v_price_deltas d
  where d.snapshot_date = p_date
    and d.trend >= cfg_min_trend
    and d.prev_low > 0 and d.low >= d.prev_low * cfg_r3
    and d.prev_trend > 0
    and abs(d.trend - d.prev_trend) / d.prev_trend < cfg_r3_stable
  on conflict (card_id, detected_date, rule) do nothing;
  rule_name := 'R3_low_jump';
  select count(*) into detections from anomalies where detected_date = p_date and rule = 'low_jump';
  return next;

  -- R4 : z-score (inchangee, en attente d'historique)
  insert into anomalies (card_id, detected_date, rule, severity, details)
  select d.card_id, d.snapshot_date, 'trend_zscore',
         round(abs((d.trend - d.prev_trend) / nullif(d.prev_trend, 0) - v.mean_return)
               / nullif(v.std_return, 0), 2),
         jsonb_build_object(
           'daily_return', round((d.trend - d.prev_trend) / nullif(d.prev_trend, 0), 4),
           'card_std_return', round(v.std_return, 4),
           'history_days', v.history_days, 'threshold', cfg_r4_z,
           'reading', 'Variation quotidienne anormale au regard de la volatilite habituelle de cette carte.')
  from v_price_deltas d
  join v_card_volatility v on v.card_id = d.card_id
  where d.snapshot_date = p_date
    and d.trend >= cfg_min_trend
    and v.history_days >= cfg_r4_days
    and v.std_return > 0 and d.prev_trend > 0
    and abs((d.trend - d.prev_trend) / d.prev_trend - v.mean_return) / v.std_return > cfg_r4_z
  on conflict (card_id, detected_date, rule) do nothing;
  rule_name := 'R4_trend_zscore';
  select count(*) into detections from anomalies where detected_date = p_date and rule = 'trend_zscore';
  return next;

  -- R5 : vague intra-set
  insert into anomalies (card_id, detected_date, rule, severity, details)
  select a.card_id, p_date, 'set_wave', sc.n,
         jsonb_build_object(
           'set_id', c.set_id, 'cards_flagged_in_set', sc.n, 'threshold', cfg_r5_min,
           'reading', 'Plusieurs cartes du meme set signalees le meme jour : coordination possible.')
  from anomalies a
  join cards c on c.id = a.card_id
  join (
    select c2.set_id, count(distinct a2.card_id) as n
    from anomalies a2 join cards c2 on c2.id = a2.card_id
    where a2.detected_date = p_date and a2.rule not in ('set_wave', 'pokemon_wave')
    group by c2.set_id having count(distinct a2.card_id) >= cfg_r5_min
  ) sc on sc.set_id = c.set_id
  where a.detected_date = p_date and a.rule not in ('set_wave', 'pokemon_wave')
  on conflict (card_id, detected_date, rule) do nothing;
  rule_name := 'R5_set_wave';
  select count(*) into detections from anomalies where detected_date = p_date and rule = 'set_wave';
  return next;

  -- R6 : vague intra-Pokemon (nee de l'investigation Ectoplasma).
  -- Regle de CONTEXTE : plusieurs cartes du meme Pokemon, tous sets confondus.
  -- Peut reveler une coordination, mais peut aussi INNOCENTER un mouvement
  -- en le rattachant a un engouement de personnage.
  insert into anomalies (card_id, detected_date, rule, severity, details)
  select a.card_id, p_date, 'pokemon_wave', pc.n,
         jsonb_build_object(
           'pokemon', p.pokemon, 'cards_flagged', pc.n, 'threshold', cfg_r6_min,
           'reading', 'Plusieurs cartes du meme Pokemon signalees le meme jour, tous sets confondus. Peut indiquer une coordination, ou au contraire un engouement legitime pour le personnage (sortie de set, meta competitive, exposition mediatique).')
  from anomalies a
  join v_card_pokemon p on p.card_id = a.card_id
  join (
    select p2.pokemon, count(distinct a2.card_id) as n
    from anomalies a2 join v_card_pokemon p2 on p2.card_id = a2.card_id
    where a2.detected_date = p_date and a2.rule not in ('set_wave', 'pokemon_wave')
    group by p2.pokemon having count(distinct a2.card_id) >= cfg_r6_min
  ) pc on pc.pokemon = p.pokemon
  where a.detected_date = p_date and a.rule not in ('set_wave', 'pokemon_wave')
  on conflict (card_id, detected_date, rule) do nothing;
  rule_name := 'R6_pokemon_wave';
  select count(*) into detections from anomalies where detected_date = p_date and rule = 'pokemon_wave';
  return next;

end;
$$;

notify pgrst, 'reload schema';