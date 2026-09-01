alter table faucet_deposits add column if not exists ip_hash text;
alter table faucet_deposits add column if not exists is_public boolean not null default false;

create index if not exists faucet_deposits_public_ip_idx
  on faucet_deposits (ip_hash, paid, created_at desc);
