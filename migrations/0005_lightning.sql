-- Real Lightning wallet + anti-bot tables.
alter table faucet_pool add column if not exists wallet_kind text;
alter table faucet_pool add column if not exists wallet_blob text;
alter table faucet_pool add column if not exists wallet_sats integer not null default 0;

-- Simulated demo sats must not become real payouts.
update faucet_pool set balance_sats = 0 where id = 1;

alter table faucet_claims add column if not exists destination_hash text;
alter table faucet_claims add column if not exists ip_hash text;
alter table faucet_claims add column if not exists payment_hash text;
alter table faucet_claims add column if not exists paid boolean not null default false;

create table if not exists faucet_challenges (
  id text primary key,
  difficulty integer not null,
  ip_hash text not null default '',
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

create index if not exists faucet_challenges_ip_idx
  on faucet_challenges (ip_hash, created_at desc);

create table if not exists faucet_deposits (
  id serial primary key,
  checking_id text not null unique,
  amount_sats integer not null,
  bolt11 text not null,
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists faucet_claims_dest_hash_idx
  on faucet_claims (destination_hash, created_at desc);

create index if not exists faucet_claims_ip_hash_idx
  on faucet_claims (ip_hash, created_at desc);
