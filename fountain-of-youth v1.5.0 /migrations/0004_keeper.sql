-- Owner-only fill: keeper phrase is hashed, never stored in plaintext.
-- The hash itself is NOT stored in this migration. It is written at runtime
-- from the KEEPER_HASH environment variable (see src/lib/faucet-api.ts).
alter table faucet_pool
  add column if not exists keeper_hash text;
