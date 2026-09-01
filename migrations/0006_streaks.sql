-- Per-address streak + leaderboard. Paid Lightning drinks only.
create table if not exists faucet_drinkers (
  destination_hash text primary key,
  destination_mask text not null,
  total_sats integer not null default 0,
  drink_count integer not null default 0,
  current_streak integer not null default 0,
  last_drink_utc text,
  updated_at timestamptz not null default now()
);

create index if not exists faucet_drinkers_sats_idx
  on faucet_drinkers (total_sats desc);

create index if not exists faucet_drinkers_streak_idx
  on faucet_drinkers (current_streak desc, total_sats desc);
