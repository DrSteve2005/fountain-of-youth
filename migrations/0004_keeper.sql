-- Owner-only fill: keeper phrase is hashed, never stored in plaintext.
alter table faucet_pool
  add column if not exists keeper_hash text;

update faucet_pool
set keeper_hash = '203b3d51a0928f3621b2a3a3e43b400c3b2a9620e3249ca87e8a96dbb421285f'
where id = 1
  and (keeper_hash is null or keeper_hash = '');
