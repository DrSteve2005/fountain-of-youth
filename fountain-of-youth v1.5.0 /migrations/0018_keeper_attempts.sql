create table if not exists faucet_keeper_attempts (
  ip_hash text primary key,
  fail_count integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
