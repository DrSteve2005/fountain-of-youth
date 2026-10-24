# Security

This is a live Lightning faucet. A bug can move real sats.

## Do not

- Open a public GitHub issue for a wallet leak, a way to drain the pot, or a
  way to bypass the day lock.
- Mail seeds, NWC strings, or the keeper phrase. Ever.

## Do

Mail **fountainofyouth.feedback@gmail.com** with the subject `SECURITY`.
Include enough to reproduce. We will not pay a bounty we have not posted.

## What this repo must never contain

- NWC connection strings
- LNbits admin keys
- The keeper phrase, or its hash
- `DATABASE_URL`
- `.env`
- Database dumps

The hash of the keeper phrase lives in the environment (`KEEPER_HASH`) and in
the live database, not in git. Wallet blobs are encrypted at rest with a key
derived from `WALLET_WRAP_KEY` or `DATABASE_URL`.
