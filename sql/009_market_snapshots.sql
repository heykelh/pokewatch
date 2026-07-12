-- Scan large : table dédiée, indexée par produit Cardmarket, compacte.
-- On ne stocke QUE les champs vivants (trend, low, avg) — les avg1/7/30
-- sont figés côté Cardmarket, donc inutiles (constat du 12/07/2026).
create table if not exists market_snapshots (
  id_product int not null,
  snapshot_date date not null,
  trend numeric,
  low numeric,
  avg numeric,
  primary key (id_product, snapshot_date)
);

create index if not exists idx_market_product_date
  on market_snapshots (id_product, snapshot_date desc);

-- Catalogue produits (nom, expansion) — mis à jour rarement
create table if not exists market_products (
  id_product int primary key,
  name text,
  id_expansion int,
  id_metacard int
);

alter table market_snapshots disable row level security;
alter table market_products disable row level security;