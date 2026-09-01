alter table faucet_day_locks
  add column if not exists hits integer not null default 1;
