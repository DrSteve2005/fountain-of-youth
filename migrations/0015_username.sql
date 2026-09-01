alter table faucet_drinkers add column if not exists username text;

create unique index if not exists faucet_drinkers_username_idx
  on faucet_drinkers (username)
  where username is not null;
