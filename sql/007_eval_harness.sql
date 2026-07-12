-- ============================================================
-- PokéWatch — Harness d'évaluation (Phase 2b)
-- Scénarios synthétiques dérivés de patterns RÉELS observés :
--   thin_market   -> cas Pikachu ex5.5-5 (sévérité 100, marché fantôme)
--   absurd_listing-> cas Mew 554275 (listing à 100 000 € vs trend 5 550 €)
--   buyout        -> signature théorique du rachat de plancher
--   pump          -> montée soutenue sur 7 jours
--   organic       -> hausse progressive légitime (post-tournoi / engouement)
--   stable        -> carte calme, témoin négatif
-- Toutes les cartes de test sont préfixées 'test-' et EXCLUES de la watchlist.
-- ============================================================

-- Attentes : ce que chaque scénario DOIT ou NE DOIT PAS déclencher,
-- au jour d'observation (le dernier jour de l'historique synthétique).
create table if not exists eval_expectations (
  scenario text not null,
  card_id text not null,
  rule text not null,
  should_fire boolean not null,
  rationale text,
  primary key (scenario, rule)
);

-- Nettoyage (rejouable)
delete from anomalies where card_id like 'test-%';
delete from cm_price_snapshots where card_id like 'test-%';
delete from cards where id like 'test-%';
delete from eval_expectations;

-- Cartes de test (hors watchlist : le cron ne les touchera jamais)
insert into cards (id, name, set_id, set_name, rarity, watchlist) values
  ('test-buyout-01',      'TEST Buyout',        'test', 'Scénarios', 'test', false),
  ('test-pump-01',        'TEST Pump',          'test', 'Scénarios', 'test', false),
  ('test-organic-01',     'TEST Organique',     'test', 'Scénarios', 'test', false),
  ('test-thin-01',        'TEST Marché mince',  'test', 'Scénarios', 'test', false),
  ('test-absurd-01',      'TEST Listing absurde','test','Scénarios', 'test', false),
  ('test-stable-01',      'TEST Stable',        'test', 'Scénarios', 'test', false);

-- ============================================================
-- Génération des historiques synthétiques : 30 jours,
-- le jour J (dernier) est le jour d'observation.
-- On utilise des dates FUTURES (2027) pour ne jamais polluer
-- les bilans réels ni les vues du dashboard.
-- ============================================================
do $$
declare
  d date;
  i int;
  base_date date := date '2027-01-01';
  obs_date date := date '2027-01-30';
begin
  for i in 0..29 loop
    d := base_date + i;

    -- 1) BUYOUT : stable 29 jours, puis au jour J le plancher bondit de +80%
    --    tandis que le trend (lissé) bouge à peine. Signature R3.
    insert into cm_price_snapshots
      (card_id, snapshot_date, source, trend, low, avg1, avg7, avg30)
    values (
      'test-buyout-01', d, 'synthetic',
      50 + (random() - 0.5),                       -- trend ~50, bruit léger
      case when i < 29 then 45 + (random() - 0.5)  -- plancher ~45
           else 81 end,                            -- jour J : plancher à 81 (+80%)
      50, 50, 50
    );

    -- 2) PUMP : montée soutenue sur les 7 derniers jours, confirmée par avg7.
    --    Signature R2 (avec la future confirmation avg7).
    insert into cm_price_snapshots
      (card_id, snapshot_date, source, trend, low, avg1, avg7, avg30)
    values (
      'test-pump-01', d, 'synthetic',
      case when i < 23 then 30 else 30 + (i - 22) * 6 end,
      case when i < 23 then 27 else 27 + (i - 22) * 6 end,
      case when i < 23 then 30 else 30 + (i - 22) * 7 end,  -- avg1 s'envole
      case when i < 23 then 30 else 30 + (i - 22) * 4 end,  -- avg7 confirme
      30                                                     -- avg30 encore bas
    );

    -- 3) ORGANIQUE : hausse progressive et modérée (+1%/jour environ).
    --    Le moteur DOIT rester silencieux : c'est un mouvement légitime.
    insert into cm_price_snapshots
      (card_id, snapshot_date, source, trend, low, avg1, avg7, avg30)
    values (
      'test-organic-01', d, 'synthetic',
      40 * power(1.01, i), 36 * power(1.01, i),
      40 * power(1.01, i), 39 * power(1.01, i), 38 * power(1.01, i)
    );

    -- 4) MARCHÉ MINCE (cas Pikachu) : trend résiduel, plancher délirant,
    --    aucune vente récente (avg1/avg7 nuls). Le moteur DOIT se taire.
    insert into cm_price_snapshots
      (card_id, snapshot_date, source, trend, low, avg1, avg7, avg30)
    values (
      'test-thin-01', d, 'synthetic',
      0.5, 50, null, null, 0.6
    );

    -- 5) LISTING ABSURDE (cas Mew 554275) : marché actif MAIS un vendeur
    --    fantaisiste place le plancher 20x au-dessus. Ratio hors-plage.
    insert into cm_price_snapshots
      (card_id, snapshot_date, source, trend, low, avg1, avg7, avg30)
    values (
      'test-absurd-01', d, 'synthetic',
      100, 2000, 100, 100, 100
    );

    -- 6) STABLE : témoin négatif absolu. Aucune règle ne doit tirer.
    insert into cm_price_snapshots
      (card_id, snapshot_date, source, trend, low, avg1, avg7, avg30)
    values (
      'test-stable-01', d, 'synthetic',
      60 + (random() - 0.5) * 0.5, 55 + (random() - 0.5) * 0.5,
      60, 60, 60
    );

  end loop;
end $$;

-- ============================================================
-- Les attentes (la vérité terrain du harness)
-- ============================================================
insert into eval_expectations (scenario, card_id, rule, should_fire, rationale) values
  ('buyout',         'test-buyout-01',  'low_jump',        true,
     'Le plancher bondit de +80% en 24h avec un trend stable : signature du rachat des offres basses.'),
  ('pump',           'test-pump-01',    'avg1_divergence', true,
     'Les ventes du jour décrochent de la moyenne mensuelle, et la moyenne 7 jours confirme la tendance.'),
  ('organic',        'test-organic-01', 'avg1_divergence', false,
     'Hausse progressive de 1%/jour : mouvement légitime, aucune alerte attendue.'),
  ('organic',        'test-organic-01', 'low_jump',        false,
     'Aucun saut brutal du plancher.'),
  ('thin_market',    'test-thin-01',    'low_above_trend', false,
     'Marché sans ventes réelles (cas Pikachu ex5.5-5) : inanalysable, donc non alertable.'),
  ('absurd_listing', 'test-absurd-01',  'low_above_trend', false,
     'Ratio plancher/trend de 20 (cas Mew 554275) : listing hors-marché, pas un buyout.'),
  ('stable',         'test-stable-01',  'low_above_trend', false,
     'Carte calme : témoin négatif.'),
  ('stable',         'test-stable-01',  'avg1_divergence', false,
     'Carte calme : témoin négatif.'),
  ('stable',         'test-stable-01',  'low_jump',        false,
     'Carte calme : témoin négatif.');