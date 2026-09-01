alter table faucet_drinkers
  add column if not exists is_pour_1000 boolean not null default false;

create unique index if not exists faucet_drinkers_pour_1000_idx
  on faucet_drinkers (is_pour_1000)
  where is_pour_1000;
