-- ============================================================
-- PokéWatch — Refondation du moteur (12/07/2026)
--
-- CONSTAT : les champs avg1/avg7/avg30 de Cardmarket sont FIGES.
-- Verifie sur 2 Price Guides consecutifs : 0 changement sur 70 975 cartes,
-- alors que le trend bougeait sur 16,6 % d'entre elles.
-- => R2 ne detectait aucun mouvement : elle resignalait un ratio statique.
--
-- CONSTAT 2 : le champ `low` agrege tous les etats de conservation.
-- Une carte a 253 EUR peut afficher un plancher a 11,89 EUR (exemplaire abime).
-- => R1 et R3 comparent des grandeurs non comparables en valeur absolue.
--
-- DECISION : R2 suspendue. R1/R3 degradees en signaux faibles.
-- Le moteur sera refonde autour du TREND, seule donnee vivante,
-- avec des moyennes mobiles calculees sur NOTRE historique.
-- ============================================================

-- Statut des règles : traçable, auditable, affichable publiquement
create table if not exists rule_status (
  rule text primary key,
  enabled boolean not null default true,
  status_label text,
  reason text,
  updated_at timestamptz default now()
);

insert into rule_status (rule, enabled, status_label, reason) values
  ('low_above_trend', true,  'Signal faible',
   'Le prix plancher agrege tous les etats de conservation. Utilisable seulement en ecart relatif, pas en valeur absolue. Refonte prevue.'),
  ('avg1_divergence', false, 'Suspendue',
   'Les moyennes de vente de la source ne sont pas rafraichies quotidiennement (0 variation sur 70 975 cartes en 24h). La regle ne detectait aucun mouvement reel.'),
  ('low_jump',        true,  'Signal faible',
   'Meme limite que R1 : le plancher peut refleter le depart d''un exemplaire abime plutot qu''un rachat de marche.'),
  ('trend_zscore',    true,  'En attente d''historique',
   'Regle la mieux fondee : elle repose sur le trend, seule donnee vivante. Necessite 14 jours d''historique.'),
  ('set_wave',        true,  'Active', 'Regle de contexte, independante de la source.'),
  ('pokemon_wave',    true,  'Active', 'Regle de contexte, nee de l''investigation Ectoplasma.')
on conflict (rule) do update
  set enabled = excluded.enabled,
      status_label = excluded.status_label,
      reason = excluded.reason,
      updated_at = now();

-- Purge des alertes R2 : elles ne signalaient aucun mouvement reel.
delete from anomalies where rule = 'avg1_divergence';

-- Desactivation effective : seuil inatteignable, trace en config
update detection_config
set value = 999999,
    description = 'SUSPENDUE le 12/07/2026 : moyennes source figees, aucun mouvement detectable.'
where key = 'r2_avg1_avg30_ratio';

create policy "public_read_rule_status" on rule_status for select using (true);
alter table rule_status enable row level security;