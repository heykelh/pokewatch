-- ============================================================
-- Couche eBay : investigation comportementale sur les cartes signalees.
-- RGPD by design : les pseudos vendeurs sont haches a l'ingestion,
-- jamais stockes en clair, jamais affiches. Retention 90 jours.
-- ============================================================

create table if not exists ebay_listings (
  id bigint generated always as identity primary key,
  card_id text references cards(id),
  collected_at date not null default current_date,
  title text,
  price numeric,
  currency text,
  condition text,              -- etat declare de la carte (Near Mint, Played...)
  seller_hash text,            -- SHA-256(pseudo + sel), JAMAIS le pseudo en clair
  item_id text,                -- id eBay de l'annonce (pas une donnee personnelle)
  is_sold boolean default false,
  sold_date date,
  raw jsonb,
  unique (item_id, collected_at)
);

create index if not exists idx_ebay_card on ebay_listings (card_id, collected_at desc);
create index if not exists idx_ebay_seller on ebay_listings (seller_hash);

-- Purge automatique au-dela de 90 jours (retention limitee)
create or replace function purge_old_ebay_data()
returns int
language sql
security definer
as $$
  with deleted as (
    delete from ebay_listings
    where collected_at < current_date - 90
    returning 1
  )
  select count(*)::int from deleted;
$$;

alter table ebay_listings enable row level security;
-- Pas de policy de lecture publique : ces donnees ne s'affichent pas.

notify pgrst, 'reload schema';
