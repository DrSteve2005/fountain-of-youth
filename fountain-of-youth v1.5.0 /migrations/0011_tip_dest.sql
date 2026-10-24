alter table faucet_deposits add column if not exists dest_hash text;

create index if not exists faucet_deposits_public_dest_idx
  on faucet_deposits (dest_hash, paid, created_at desc);
