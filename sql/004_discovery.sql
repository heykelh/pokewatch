-- Sondes : plages d'IDs connues pour être absentes, retestées chaque semaine
create table if not exists discovery_probes (
  card_id text primary key,
  reason text,
  first_probed date default current_date,
  last_probed date,
  resolved boolean default false
);

insert into discovery_probes (card_id, reason)
select 'mep-' || lpad(n::text, 3, '0'), 'Série 2 Premiers Partenaires 30 ans (non indexée au 2026-07-11)'
from generate_series(46, 63) n
on conflict (card_id) do nothing;

-- Journal d'entrée en watchlist : traçabilité de l'univers de surveillance
create table if not exists watchlist_log (
  id bigint generated always as identity primary key,
  card_id text not null,
  added_date date default current_date,
  reason text not null
);

-- Quarantaine des cartes fraîches (sera branchée aux règles lors de la calibration J+7,
-- pour ne pas modifier le moteur pendant l'observation)
insert into detection_config (key, value, description) values
  ('quarantine_days', 14, 'Jours de présence en base avant qu''une carte soit flaggable')
on conflict (key) do nothing;