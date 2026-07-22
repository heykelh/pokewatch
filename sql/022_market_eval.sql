-- ============================================================
-- Harness d'evaluation du moteur Price Guide.
--
-- Les scenarios utilisent des id_product NEGATIFS (impossibles chez
-- Cardmarket) et des dates FUTURES (janvier 2027), afin que la population
-- observee ce jour-la soit exclusivement synthetique : le mouvement median
-- du marche est alors maitrise, condition necessaire pour tester R7.
--
-- Chaque scenario derive d'un pattern REEL observe entre le 11 et le 22
-- juillet 2026.
-- ============================================================

create table if not exists market_eval_expectations (
  scenario text not null,
  id_product int not null,
  rule text not null,
  should_fire boolean not null,
  rationale text,
  primary key (scenario, rule)
);

delete from market_anomalies where id_product < 0;
delete from market_snapshots where id_product < 0;
delete from market_products where id_product < 0;
delete from market_eval_expectations;

insert into market_products (id_product, name, id_expansion) values
  (-1, 'TEST Divergence reelle',    -1),
  (-2, 'TEST Rattrapage apres gel', -2),
  (-3, 'TEST Carte illiquide',      -3),
  (-4, 'TEST Suiveur de marche',    -4),
  (-5, 'TEST Decrochage moyenne',   -5),
  (-6, 'TEST Stable',               -6),
  (-7, 'TEST Bond du plancher',     -7);

-- Cartes de bruit : elles fixent le mouvement median du marche a ~0 %,
-- reference indispensable pour juger un ecart.
insert into market_products (id_product, name, id_expansion)
select -1000 - g, 'TEST Bruit ' || g, -1000 from generate_series(1, 20) g;

do $$
declare
  i int;
  d date;
  base date := date '2027-01-01';
  g int;
begin
  for i in 0..29 loop
    d := base + i;

    -- Bruit : legere hausse reguliere -> mediane du marche proche de zero,
    -- et trend qui bouge chaque jour (donc pas de gel).
    for g in 1..20 loop
      insert into market_snapshots (id_product, snapshot_date, trend, low, avg)
      values (-1000 - g, d, 50 + g * 0.1 + i * 0.01, 20, 50 + g * 0.1);
    end loop;

    -- -1 DIVERGENCE REELLE : le prix bouge chaque jour (days_frozen = 1,
    -- moves_7d = 7) et decroche nettement du marche au jour d'observation.
    -- Verifie : 48,40 -> 65 EUR, soit +34,3 % contre un marche a +0,02 %.
    insert into market_snapshots (id_product, snapshot_date, trend, low, avg)
    values (-1, d,
            case when i < 29 then 40 + i * 0.3 else 65 end,
            15, 45);

    -- -2 RATTRAPAGE APRES GEL : prix fige les trois derniers jours avant
    -- le saut. Cas Arcanine / Mewtwo EX du 22/07 : la variation condense
    -- plusieurs jours et n'est pas comparable au mouvement quotidien.
    -- Verifie : days_frozen = 3, donc rejete malgre un +59 %.
    insert into market_snapshots (id_product, snapshot_date, trend, low, avg)
    values (-2, d,
            case when i < 26 then 40 + i * 0.2
                 when i < 29 then 45.2
                 else 72 end,
            15, 48);

    -- -3 CARTE ILLIQUIDE : un seul mouvement sur sept jours.
    -- Verifie : moves_7d = 1, donc rejete malgre un +60 %.
    insert into market_snapshots (id_product, snapshot_date, trend, low, avg)
    values (-3, d,
            case when i < 29 then 30 else 48 end,
            12, 32);

    -- -4 SUIVEUR DE MARCHE : monte comme tout le monde.
    -- Verifie : +0,19 % contre un marche a +0,02 %, ecart negligeable.
    insert into market_snapshots (id_product, snapshot_date, trend, low, avg)
    values (-4, d, 60 + i * 0.12, 25, 62);

    -- -5 DECROCHAGE DE MOYENNE : hausse soutenue sur les sept derniers
    -- jours, confirmee sur trente. Signature R2b.
    -- Pas de 5 EUR/jour : sur une rampe lineaire, le ratio trend/ma7 ne
    -- depasse 1,25 que si le pas excede un huitieme de la base.
    -- Verifie : trend 65, ma7 50 (ratio 1,30), ma30 35,09 (ratio 1,43).
    insert into market_snapshots (id_product, snapshot_date, trend, low, avg)
    values (-5, d,
            case when i < 23 then 30 + i * 0.05 else 30 + (i - 22) * 5 end,
            12, 33);

    -- -6 STABLE : temoin negatif absolu.
    insert into market_snapshots (id_product, snapshot_date, trend, low, avg)
    values (-6, d, 55 + (case when i % 2 = 0 then 0.02 else -0.02 end), 22, 55);

    -- -7 BOND DU PLANCHER : le plancher saute, le prix de reference non.
    -- Verifie : 20 -> 34 EUR, ratio 1,70 au-dessus du seuil de 1,50.
    insert into market_snapshots (id_product, snapshot_date, trend, low, avg)
    values (-7, d,
            50 + (case when i % 2 = 0 then 0.03 else -0.03 end),
            case when i < 29 then 20 else 34 end,
            51);

  end loop;
end $$;

-- ============================================================
-- La verite terrain
-- ============================================================
insert into market_eval_expectations (scenario, id_product, rule, should_fire, rationale) values
  ('divergence_reelle', -1, 'market_divergence', true,
    'Prix en mouvement quotidien, ecart net au marche : signal legitime.'),

  ('rattrapage_gel',    -2, 'market_divergence', false,
    'Prix fige trois jours puis rattrapage : la variation condense plusieurs jours, incomparable au mouvement quotidien du marche (cas Arcanine, 22/07).'),

  ('illiquide',         -3, 'market_divergence', false,
    'Un seul mouvement de prix sur sept jours : la carte ne cote pas assez pour qu''une variation quotidienne ait un sens.'),

  ('suiveur_marche',    -4, 'market_divergence', false,
    'La carte suit le mouvement d''ensemble : monter quand le marche monte n''est pas un signal.'),

  ('decrochage_moyenne', -5, 'trend_ma_divergence', true,
    'Hausse soutenue sur sept jours, confirmee sur trente : decrochage de la moyenne mobile.'),

  ('stable',            -6, 'market_divergence',  false, 'Temoin negatif.'),
  ('stable',            -6, 'trend_ma_divergence', false, 'Temoin negatif.'),
  ('stable',            -6, 'low_jump',            false, 'Temoin negatif.'),

  ('bond_plancher',     -7, 'low_jump', true,
    'Le plancher bondit sans mouvement du prix de reference. Signal faible assume.');

alter table market_eval_expectations disable row level security;

-- Indispensable : la vue materialisee doit integrer les donnees synthetiques
refresh materialized view mv_market_daily;
