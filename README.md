🌊 Fountain of Youth
A public Lightning faucet. Paste an address, drink a random pour of sats.
No accounts. No ads. No tracking.
Every fill goes 100% back into pours.

Live: https://getfountainofyouth.net

⚡ How it behaves
One paid drink per Lightning address per UTC day

Shared networks (cafés, offices, apartments) can drink multiple times

Payouts scale with the pot — odds stay constant

Public fills: 100–10,000 sats, one address per 24 hours

The Keeper can close the spring; streaks freeze while closed

Not a mixer, not a bank, not a business — just a spring

🧱 Stack
TanStack Start

Postgres (Neon in production, PGLite for empty local dev)

Lightning via NWC (Alby Hub) or LNbits

🛠 Run locally
Kod
npm install
cp .env.example .env
# set KEEPER_HASH — see below
npm run dev
Without DATABASE_URL, it boots with an empty in-memory Postgres.
UI works. Payouts do not.

🔑 Keeper Hash
The door phrase is never stored. Git never sees it.

Kod
node scripts/hash-keeper.mjs "your phrase"
Use six random dictionary words (Diceware).
Put the hex output into KEEPER_HASH.

A clone does not get your hash.

🌐 Production env
Variable	Required	Purpose
DATABASE_URL	yes	Neon (or any Postgres)
KEEPER_HASH	yes on fresh DB	64‑char hex from hash‑keeper.mjs
WALLET_WRAP_KEY	recommended	Wraps NWC blob at rest


Connect the wallet through the Keeper door.
Never paste NWC into git, issues, or screenshots.

📜 Scripts
Command	What
npm run dev	Local dev server
npm run build	Build + run migrations
npm run typecheck	TypeScript check
npm run lint / format	ESLint / Prettier
npm test	Unit tests


🚀 Deploy
Vercel (or similar) + Neon + a 24/7 Alby Hub (e.g. Nodana).
Set env vars on the host.
Run npm run build — migrations apply automatically.

Reconnect the NWC wallet once after the first deploy that encrypts with DATABASE_URL / WALLET_WRAP_KEY.

🧼 Before pushing to GitHub
Delete or exclude:

node_modules/

.env and any real secrets

📄 License
This project is licensed under the GNU Affero General Public License v3.0 (AGPL‑3.0).
See LICENSE for details.
