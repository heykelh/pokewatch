-- Les vues excluaient toute source autre que 'tcgdex', rendant le harness aveugle.
-- Correctif : partitionner par (card_id, source) et accepter toutes les sources.

drop view if exists v_price_deltas cascade;
drop view if exists v_card_volatility cascade;

create view v_price_deltas as
select
  s.card_id,
  s.snapshot_date,
  s.source,
  s.trend, s.low, s.avg1, s.avg7, s.avg30,
  lag(s.trend) over w as prev_trend,
  lag(s.low)   over w as prev_low,
  lag(s.snapshot_date) over w as prev_date
from cm_price_snapshots s
window w as (partition by s.card_id, s.source order by s.snapshot_date);

create view v_card_volatility as
select
  card_id,
  count(*) as history_days,
  avg(daily_return)    as mean_return,
  stddev(daily_return) as std_return
from (
  select card_id, source, snapshot_date,
         (trend - lag(trend) over (partition by card_id, source order by snapshot_date))
         / nullif(lag(trend) over (partition by card_id, source order by snapshot_date), 0)
         as daily_return
  from cm_price_snapshots
) r
where daily_return is not null
group by card_id;