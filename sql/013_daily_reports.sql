create table if not exists daily_reports (
  report_date date primary key,
  headline text not null,
  body text not null,
  verdict text not null,           -- 'calme' | 'signaux_faibles' | 'attention' | 'alerte'
  dossier jsonb not null,          -- le dossier factuel source, pour audit
  model text,
  generated_at timestamptz default now()
);

alter table daily_reports enable row level security;
create policy "public_read_daily_reports" on daily_reports for select using (true);

-- Le dossier factuel : tout ce que le LLM recevra, et rien d'autre.
create or replace function build_daily_dossier(p_date date default current_date)
returns jsonb
language sql
as $$
select jsonb_build_object(
  'date', p_date,
  'history_days', (
    select count(distinct snapshot_date) from market_snapshots
  ),
  'cards_scanned', (
    select count(*) from market_snapshots where snapshot_date = p_date
  ),
  'market_median_return', (
    select round(median_return::numeric, 4) from v_market_daily where snapshot_date = p_date
  ),
  'rules_status', (
    select jsonb_agg(jsonb_build_object(
      'rule', rule, 'status', status_label, 'reason', reason
    )) from rule_status
  ),
  'anomalies', coalesce((
    select jsonb_agg(jsonb_build_object(
      'card', c.name,
      'card_id', a.card_id,
      'set', c.set_name,
      'rule', a.rule,
      'severity', a.severity,
      'details', a.details
    ) order by a.severity desc)
    from anomalies a
    join cards c on c.id = a.card_id
    where a.detected_date = p_date
      and a.card_id not like 'test-%'
  ), '[]'::jsonb),
  'top_movers', coalesce((
    select jsonb_agg(jsonb_build_object(
      'name', name,
      'trend', trend,
      'prev_trend', prev_trend,
      'change_pct', round((daily_return * 100)::numeric, 1)
    ) order by daily_return desc)
    from (
      select * from v_market_movers
      where snapshot_date = p_date
      order by daily_return desc
      limit 5
    ) m
  ), '[]'::jsonb)
);
$$;

notify pgrst, 'reload schema';