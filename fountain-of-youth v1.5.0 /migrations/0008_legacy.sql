-- First 100 unique paid drinkers keep a permanent Legacy mark.
alter table faucet_drinkers
  add column if not exists is_legacy boolean not null default false;
alter table faucet_drinkers
  add column if not exists legacy_rank integer;
alter table faucet_pool
  add column if not exists legacy_awarded integer not null default 0;
