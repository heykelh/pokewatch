-- Univers de cartes suivies
create table cards (
  id text primary key,              -- id TCGdex, ex: 'swsh3-136'
  name text not null,
  set_id text not null,
  set_name text,
  rarity text,
  image_url text,
  watchlist boolean default true,   -- pilote: univers restreint
  created_at timestamptz default now()
);

-- Snapshots quotidiens Cardmarket
create table cm_price_snapshots (
  id bigint generated always as identity primary key,
  card_id text not null references cards(id),
  snapshot_date date not null,
  source text not null default 'tcgdex',  -- 'tcgdex' | 'cm_priceguide'
  unit text default 'EUR',
  avg numeric, low numeric, trend numeric,
  avg1 numeric, avg7 numeric, avg30 numeric,
  avg_holo numeric, low_holo numeric, trend_holo numeric,
  avg1_holo numeric, avg7_holo numeric, avg30_holo numeric,
  raw jsonb,                        -- réponse brute, pour audit/replay
  created_at timestamptz default now(),
  unique (card_id, snapshot_date, source)
);

create index idx_snapshots_card_date on cm_price_snapshots (card_id, snapshot_date desc);

-- Anomalies détectées (alimentée en Phase 2)
create table anomalies (
  id bigint generated always as identity primary key,
  card_id text not null references cards(id),
  detected_date date not null,
  rule text not null,               -- 'low_jump' | 'avg1_divergence' | 'set_wave'
  severity numeric not null,        -- z-score ou ratio
  details jsonb not null,           -- valeurs avant/après, seuils
  status text default 'open',       -- 'open' | 'investigated' | 'dismissed'
  created_at timestamptz default now(),
  unique (card_id, detected_date, rule)
);