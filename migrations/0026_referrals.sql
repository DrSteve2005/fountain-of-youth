-- Guide badge (invite links). Each drinker gets a random invite code, minted
-- the first time it is needed. A referral row is written when an address takes
-- its first paid drink through someone's code. referred_hash is the primary
-- key, so a person counts for one guide only, once. Boot runs the same DDL in
-- ensureReferralSchema, so this file is safe to apply before or after deploy.

alter table faucet_drinkers
  add column if not exists ref_code text;

create unique index if not exists faucet_drinkers_ref_code_idx
  on faucet_drinkers (ref_code)
  where ref_code is not null;

create table if not exists faucet_referrals (
  referred_hash text primary key,
  referrer_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists faucet_referrals_referrer_idx
  on faucet_referrals (referrer_hash);
