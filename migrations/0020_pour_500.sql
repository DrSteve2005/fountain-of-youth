alter table faucet_drinkers
  add column if not exists is_pour_500 boolean not null default false;

create unique index if not exists faucet_drinkers_pour_500_idx
  on faucet_drinkers (is_pour_500)
  where is_pour_500;
