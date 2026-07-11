-- Cache des sets TCGdex : évite de re-fetcher le détail de chaque set chaque semaine
create table if not exists discovery_sets (
  set_id text primary key,
  name text,
  release_date date,
  card_count int,
  last_scanned date
);