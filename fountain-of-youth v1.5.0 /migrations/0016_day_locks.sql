create table if not exists faucet_day_locks (
  kind text not null,
  lock_hash text not null,
  drink_utc text not null,
  created_at timestamptz not null default now(),
  primary key (kind, lock_hash, drink_utc)
);
