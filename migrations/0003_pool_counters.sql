-- Align pool counters with the claim ledger.
update faucet_pool
set
  claim_count = (select count(*)::int from faucet_claims),
  total_claimed_sats = (select coalesce(sum(amount_sats), 0)::int from faucet_claims)
where id = 1;
