# Fountain of Youth

A free Lightning faucet. Paste a Lightning address, drink a random pour of sats.
No accounts. No ads. Every fill goes 100% back into pours.

**Live:** [getfountainofyouth.net](https://getfountainofyouth.net)

Not a mixer, not a bank, not a business. Just sats for people who want to try Lightning.

## How it works

- One paid drink per Lightning address per UTC day.
- A shared connection (building Wi-Fi) can drink twice a UTC day.
- A random pour. Ordinary sips grow with the size of the pot. The jackpot is 10% of the pot and gets rarer as the prize grows. One jackpot per UTC day.
- A UTC day pays about 30% of the pot in ordinary pours, then the spring rests. Under 1,000 sats the cap is off.
- Streaks: paid days in a row lift the sip (+1% per day, up to +25%) and the jackpot odds (up to 1.5×). Seven days earns one grace day. Days the pot is dry do not break a streak.
- Invite links: after a first paid drink, each address gets a link with a random code. People who take their first paid drink through it level up the Guide badge (Scout 1, Guide 3, Pathfinder 10, Cartographer 21). Badge only, no extra sats.
- Anyone can fill the spring with a Lightning invoice (100–10,000 sats, one address per 24 hours).
- Spam is blocked with a small proof-of-work puzzle in the browser, plus per-address and per-connection limits.
- Visitors from sanctioned countries are refused (see `src/lib/geo-block.ts`).
- English and Spanish. A live badge for other sites: iframe `/embed`, or `GET /api/pot` (CORS open).

The full change history is in [CHANGELOG.md](CHANGELOG.md).

## Terms used here

- **Keeper**: the person running the faucet. The keeper signs in through the padlock icon in the header (the "door") to connect the wallet, close the spring for maintenance and see the dashboard.
- **Keeper phrase**: a secret phrase of six random dictionary words (Diceware) that opens the door. It is never stored anywhere. Only its SHA-256 hash is set as `KEEPER_HASH`.
- **Wallet**: the Lightning wallet that pays out. Connect it through the keeper door using [NWC](https://nwc.dev/) (for example an [Alby Hub](https://albyhub.com/)) or LNbits. The connection is stored encrypted in the database, not in environment variables.

## Stack

[TanStack Start](https://tanstack.com/start) (React, TypeScript), Postgres via Kysely
(Neon in production, in-memory PGlite for local development), deployed on Vercel.

## Run it locally

```bash
npm install
cp .env.example .env
# set KEEPER_HASH, see below
npm run dev
```

Without `DATABASE_URL` it starts on an empty in-memory Postgres. That is fine for working on the UI,
but it cannot pay sats until you point it at a real database and connect a wallet.

Requires Node 22.6 or newer to run the `.ts` tests (`npm test`).

### Keeper hash

```bash
node scripts/hash-keeper.mjs "your six word phrase"
```

Put the printed 64-character hex in `KEEPER_HASH`. Write the phrase down offline and
never commit it. A short phrase can be guessed offline from its hash, so use six random words.

## Self-hosting in production

Set these environment variables on your host (on Vercel, in the Production scope):

| Variable | Required | What |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (for example from Neon) |
| `KEEPER_HASH` | yes | 64-character hex from `hash-keeper.mjs` |
| `WALLET_WRAP_KEY` | recommended | Long random string (`openssl rand -hex 32`) that encrypts the wallet connection at rest |

Run `npm run build`. Database migrations apply during the build when `DATABASE_URL` is set.
After the first deploy, open the keeper door and connect your wallet. Never paste a wallet
connection string into git, issues or screenshots.

The country block reads the `x-vercel-ip-country` header. On another host that does not set it,
the block does nothing.

## Security

See [SECURITY.md](SECURITY.md) to report a problem.

## License

GNU Affero General Public License v3.0 (AGPL-3.0). See [LICENSE](LICENSE).
