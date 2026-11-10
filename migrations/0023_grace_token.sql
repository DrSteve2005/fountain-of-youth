-- Grace token column. Live 7+ day drinkers are granted once by the app
-- (freeze-aware). Do not blanket-update here — that would gift a token to
-- streaks that already died, which then burns on the next drink.
alter table faucet_drinkers
  add column if not exists grace_token boolean not null default false;
