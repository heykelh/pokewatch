-- Vues publiques pour le dashboard : le scan large devient visible.
-- Le mouvement du marche par jour + les cartes qui bougent le plus.

create or replace view v_market_movers as
select
  m.id_product,
  p.name,
  m.snapshot_date,
  m.trend,
  m.prev_trend,
  m.daily_return,
  m.history_days
from v_market_trend_ma m
left join market_products p on p.id_product = m.id_product
where m.daily_return is not null;

-- Acces public en lecture
alter table market_snapshots enable row level security;
alter table market_products enable row level security;
create policy "public_read_market_snapshots" on market_snapshots for select using (true);
create policy "public_read_market_products" on market_products for select using (true);

notify pgrst, 'reload schema';