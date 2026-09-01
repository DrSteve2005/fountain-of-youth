-- Shared sat well. Unowned rows: anyone can drip or load.
create table if not exists faucet_pool (
  id integer primary key,
  balance_sats integer not null check (balance_sats >= 0),
  total_funded_sats integer not null default 0,
  total_claimed_sats integer not null default 0,
  claim_count integer not null default 0,
  fund_count integer not null default 0
);

insert into faucet_pool (id, balance_sats, total_funded_sats)
values (1, 1000000, 1000000)
on conflict (id) do nothing;

create table if not exists faucet_claims (
  id serial primary key,
  amount_sats integer not null,
  destination_kind text not null,
  destination_mask text not null,
  claim_token_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists faucet_claims_created_at_idx
  on faucet_claims (created_at desc);

create index if not exists faucet_claims_token_idx
  on faucet_claims (claim_token_hash, created_at desc);

create table if not exists faucet_funds (
  id serial primary key,
  amount_sats integer not null,
  created_at timestamptz not null default now()
);
