-- Drop demo ledger rows. Counters and recent pours are paid Lightning only.
delete from faucet_claims
where claim_token_hash = 'seed'
   or (coalesce(paid, false) = false and destination_hash is null);

update faucet_pool
set
  claim_count = (select count(*)::int from faucet_claims where coalesce(paid, false) = true),
  total_claimed_sats = (
    select coalesce(sum(amount_sats), 0)::int
    from faucet_claims
    where coalesce(paid, false) = true
  )
where id = 1;
