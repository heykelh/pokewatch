create or replace function build_daily_dossier(p_date date default current_date)
returns jsonb
language sql
as $$
with scan as (
  select count(*) as n from market_snapshots
  where snapshot_date = p_date and id_product > 0
),
anos as (
  select count(*) filter (
           where rule in ('trend_zscore','trend_ma_divergence','market_divergence')
         ) as fortes,
         count(*) as total
  from market_anomalies
  where detected_date = p_date and id_product > 0
),
-- Reference : distribution du volume d'anomalies fortes les jours precedents.
-- Un jour n'est "anormal" que par rapport a l'activite habituelle du marche,
-- pas par rapport a un seuil devine.
hist as (
  select count(*) as jours,
         percentile_cont(0.5) within group (order by n) as med,
         percentile_cont(0.9) within group (order by n) as p90
  from (
    select detected_date, count(*) as n
    from market_anomalies
    where id_product > 0
      and detected_date < p_date
      and rule in ('trend_zscore','trend_ma_divergence','market_divergence')
    group by detected_date
    having count(*) > 0        -- exclut les jours sans donnees ou sans historique
  ) d
)
select jsonb_build_object(
  'date', p_date,
  'data_available', (select n from scan) > 0,
  'data_status', case
    when (select n from scan) > 0 then 'Collecte du jour effectuee.'
    else 'AUCUNE DONNEE POUR CE JOUR : la collecte n''a pas eu lieu. Aucune conclusion possible.'
  end,
  'verdict_calcule', case
    when (select n from scan) = 0                     then 'donnees_indisponibles'
    when (select total from anos) = 0                 then 'calme'
    when (select jours from hist) < 3                 then 'activite_normale'
    when (select fortes from anos) > (select p90 from hist) * 1.5 then 'alerte'
    when (select fortes from anos) > (select p90 from hist)       then 'attention'
    else 'activite_normale'
  end,
  'activite_habituelle', jsonb_build_object(
    'jours_de_reference', (select jours from hist),
    'mediane_anomalies_fortes', round((select med from hist)::numeric, 0),
    'p90_anomalies_fortes', round((select p90 from hist)::numeric, 0),
    'anomalies_fortes_aujourdhui', (select fortes from anos)
  ),
  'history_days', (select count(distinct snapshot_date) from market_snapshots where id_product > 0),
  'cards_scanned', (select n from scan),
  'market_median_return_pct', (
    select round((median_return * 100)::numeric, 2)
    from v_market_daily where snapshot_date = p_date
  ),
  'data_reliability_pct', (
    select pct_fiable from v_data_quality where snapshot_date = p_date
  ),
  'anomalies_total', (select total from anos),
  'anomalies_par_regle', coalesce((
    select jsonb_object_agg(rule, n)
    from (select rule, count(*) as n from market_anomalies
          where detected_date = p_date and id_product > 0 group by rule) r
  ), '{}'::jsonb),
  'anomalies', coalesce((
    select jsonb_agg(jsonb_build_object(
      'card', p.name, 'rule', a.rule, 'severity', a.severity,
      'reading', a.details->>'reading'
    ) order by a.severity desc)
    from (select * from market_anomalies
          where detected_date = p_date and id_product > 0
          order by severity desc limit 10) a
    left join market_products p on p.id_product = a.id_product
  ), '[]'::jsonb),
  'top_movers', coalesce((
    select jsonb_agg(jsonb_build_object(
      'name', name, 'trend', trend, 'prev_trend', prev_trend,
      'change_pct', round((daily_return * 100)::numeric, 1),
      'excess_vs_market_pct', round((excess_return * 100)::numeric, 1)
    ) order by excess_return desc)
    from (select * from v_market_movers
          where snapshot_date = p_date and id_product > 0
            and moves_7d >= 3          -- meme filtre de liquidite que le moteur
            and days_frozen <= 1       -- variation reellement quotidienne
          order by excess_return desc limit 5) m
  ), '[]'::jsonb)
);
$$;

notify pgrst, 'reload schema';
