alter table faucet_claims add column if not exists pour_tier text;

update faucet_claims
set pour_tier = case
  when amount_sats >= 2100 then 'jackpot'
  when amount_sats >= 500 then 'rare'
  when amount_sats >= 100 then 'uncommon'
  else 'common'
end
where pour_tier is null;
