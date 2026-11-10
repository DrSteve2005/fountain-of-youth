-- Days the spring cannot pay (empty pot / wallet too low) do not break
-- streaks. Open window in spring_dry_from, closed spells in spring_dry_log.

alter table faucet_pool
  add column if not exists spring_dry_from text;

alter table faucet_pool
  add column if not exists spring_dry_log jsonb not null default '[]'::jsonb;
