alter table faucet_pool add column if not exists maintenance boolean not null default false;
alter table faucet_pool add column if not exists streak_freeze_from text;
alter table faucet_pool add column if not exists streak_freeze_until text;
