-- Evenements externes horodates pouvant influencer le marche.
-- On documente le MECANISME et son EFFET MESURE, jamais la personne.
create table if not exists market_events (
  id bigint generated always as identity primary key,
  event_date date not null,
  event_type text not null,     -- 'recommandation_publique' | 'tournoi' | 'annonce_officielle' | 'reprint'
  description text not null,
  source_url text,
  created_at timestamptz default now()
);

create table if not exists market_event_cards (
  event_id bigint references market_events(id),
  card_id text references cards(id),
  primary key (event_id, card_id)
);

alter table market_events enable row level security;
alter table market_event_cards enable row level security;
create policy "public_read_events" on market_events for select using (true);
create policy "public_read_event_cards" on market_event_cards for select using (true);

notify pgrst, 'reload schema';

insert into market_events (event_date, event_type, description)
values (
  '2026-07-13',
  'recommandation_publique',
  'Vidéo présentant cinq cartes comme sous-cotées, diffusée sur une plateforme de partage vidéo. Cinq cartes explicitement nommées.'
);

insert into market_event_cards (event_id, card_id)
select (select max(id) from market_events), unnest(array[
  'mep-033', 'swshp-SWSH283', 'swshp-SWSH136', 'swshp-SWSH133', 'swsh9.5tg-TG05'
]);