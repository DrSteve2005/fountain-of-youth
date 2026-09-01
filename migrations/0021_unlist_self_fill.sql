alter table faucet_donors
  add column if not exists listed boolean not null default true;

alter table faucet_deposits
  add column if not exists listed boolean not null default true;

alter table faucet_pool
  add column if not exists basin_unlisted_10k boolean not null default false;

-- One-time: drop the keeper's 10k self-fill from the public basin. Sats stay
-- in the pot. Later 10k fills from other people stay listed.
update faucet_donors
set listed = false
where total_sats = 10000
  and fill_count = 1
  and listed = true
  and exists (
    select 1 from faucet_pool where id = 1 and basin_unlisted_10k = false
  );

update faucet_deposits
set listed = false
where is_public = true
  and paid = true
  and amount_sats = 10000
  and listed = true
  and exists (
    select 1 from faucet_pool where id = 1 and basin_unlisted_10k = false
  );

update faucet_pool
set basin_unlisted_10k = true
where id = 1;
