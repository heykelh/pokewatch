-- ============================================================
-- Analyse de concentration de l'offre eBay.
--
-- Question posee : pour une carte donnee, l'offre est-elle dominee
-- par un petit nombre de vendeurs ? Un vendeur qui controle une part
-- anormale de l'offre d'une carte en anomalie est le signal recherche.
--
-- Indice de Herfindahl-Hirschman (HHI) : somme des carres des parts
-- de marche, exprimee sur 10 000. Outil des autorites de concurrence.
--   < 1500  : marche disperse
--   1500-2500 : concentration moderee
--   > 2500  : forte concentration (un ou deux vendeurs dominent)
-- ============================================================

create or replace view v_ebay_concentration as
with offre as (
  select
    card_id,
    collected_at,
    grading,
    seller_hash,
    count(*) as annonces_vendeur
  from ebay_listings
  where seller_hash is not null
  group by card_id, collected_at, grading, seller_hash
),
totaux as (
  select card_id, collected_at, grading,
         sum(annonces_vendeur) as total_annonces,
         count(*) as nb_vendeurs
  from offre
  group by card_id, collected_at, grading
),
parts as (
  select o.card_id, o.collected_at, o.grading, o.seller_hash,
         o.annonces_vendeur,
         t.total_annonces, t.nb_vendeurs,
         o.annonces_vendeur::numeric / t.total_annonces as part
  from offre o
  join totaux t
    on t.card_id = o.card_id
   and t.collected_at = o.collected_at
   and t.grading = o.grading
)
select
  card_id,
  collected_at,
  grading,
  max(total_annonces) as annonces,
  max(nb_vendeurs) as vendeurs,
  -- HHI sur 10 000
  round(sum(part * part) * 10000) as hhi,
  -- part du plus gros vendeur, en %
  round(max(part) * 100, 1) as part_max_pct,
  -- interpretation lisible
  case
    when round(sum(part * part) * 10000) > 2500 then 'concentration forte'
    when round(sum(part * part) * 10000) > 1500 then 'concentration moderee'
    else 'offre dispersee'
  end as lecture
from parts
group by card_id, collected_at, grading;

notify pgrst, 'reload schema';
