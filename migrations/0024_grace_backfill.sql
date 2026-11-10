-- Freeze log keeps older maintenance windows when the well closes twice.
-- grace_backfilled is flipped by the one-time live backfill, not here,
-- so freeze-aware granting still runs after this file.

alter table faucet_pool
  add column if not exists grace_backfilled boolean not null default false;

alter table faucet_pool
  add column if not exists streak_freeze_log jsonb not null default '[]'::jsonb;
