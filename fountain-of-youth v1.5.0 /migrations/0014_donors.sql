alter table faucet_deposits add column if not exists dest_mask text;

create table if not exists faucet_donors (
  destination_hash text primary key,
  destination_mask text not null,
  total_sats integer not null default 0,
  fill_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists faucet_donors_sats_idx
  on faucet_donors (total_sats desc);
