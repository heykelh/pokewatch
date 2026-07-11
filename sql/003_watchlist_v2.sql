-- Colonne de mapping produit Cardmarket + backfill depuis les snapshots existants
alter table cards add column if not exists cm_id_product text;

update cards c
set cm_id_product = s.raw->>'idProduct'
from (
  select distinct on (card_id) card_id, raw->>'idProduct' as "idProduct", raw
  from cm_price_snapshots
  order by card_id, snapshot_date desc
) s
where s.card_id = c.id;

-- Garde-fou structurel : un seul membre de watchlist par produit Cardmarket
create unique index if not exists uq_watchlist_product
on cards (cm_id_product) where watchlist = true and cm_id_product is not null;