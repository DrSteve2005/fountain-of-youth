# Fountain of Youth

A public Lightning faucet. Paste an address, drink a random pour of sats.
No accounts. No ads. Fills go 100% back into pours.

Live: [getfountainofyouth.net](https://getfountainofyouth.net)

## How it behaves

- One paid drink per Lightning address per UTC day
- A shared connection can drink a few times a day so a building is not locked out
- Payouts scale with the pot. Odds stay the same. A fat well pays more.
- Public fills: 100–10,000 sats, one address per 24 hours, listed under the basin
- The keeper can close the spring. Streaks freeze while it is closed.

This is not a mixer, not a bank, and not a business.

## Stack

TanStack Start, Postgres (Neon in production, PGLite for empty local), Lightning
via [NWC](https://nwc.dev/) (Alby Hub) or LNbits.

## Run it locally

```bash
npm install
cp .env.example .env
# set KEEPER_HASH — see below
npm run dev
```

Without `DATABASE_URL` it boots on an empty in-memory Postgres. Fine for UI.
It will not pay sats until you connect a wallet and point it at real Postgres.

### Keeper hash

The door phrase is never stored. Git never sees it.

```bash
node scripts/hash-keeper.mjs "your phrase"
```

Put the hex in `KEEPER_HASH`. Use **six** random dictionary words (Diceware),
written down offline. Four is too few once this repo is public — SHA-256 of a
short phrase can be guessed offline. A clone does not get your hash.

### Production env

| Variable | Required | What |
|---|---|---|
| `DATABASE_URL` | yes | Neon (or any Postgres) |
| `KEEPER_HASH` | yes on a fresh database | 64-char hex from `hash-keeper.mjs` |
| `WALLET_WRAP_KEY` | recommended | 16+ chars; wraps the NWC blob at rest |

Then connect the wallet through the keeper door on the site. Do not paste NWC
into git, issues, or screenshots.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Build + run pending migrations |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm test` | Unit tests |

## Deploy

Vercel (or similar) + Neon + a 24/7 Alby Hub (e.g. Nodana). Set the env vars
on the host. Run `npm run build` — migrations apply during build when
`DATABASE_URL` is set.

Reconnect the NWC wallet once after the first deploy that encrypts with
`DATABASE_URL` / `WALLET_WRAP_KEY`, so an old blob wrapped with the legacy
salt is not left behind.

## Before you push this to GitHub

Delete or leave out:

- `node_modules/`
- `.env` and any real secrets
- `.grok/`, `AGENTS.md` (builder internals)
- `screenshots/`, `attachments/`, `artifacts/`, `*.zip`
- `public/__grok/` (install chrome for the builder preview)

Do not upload a zip of the whole workspace. Init git in a clean folder, add
the source, push.

```bash
git init
git add .
git status   # read this. if you see .env or nwc, stop.
git commit -m "Initial public source"
```

Create an empty GitHub repo, then `git remote add origin …` and `git push`.
Set the repo to public when you are ready. Add `SECURITY.md` contact on the
repo’s Security tab if you want.

## License

MIT. See [LICENSE](LICENSE).
