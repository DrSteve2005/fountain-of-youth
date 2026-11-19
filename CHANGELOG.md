# Changelog

Technical changelog. The user-facing notes live at `/changelog` in the app.
Dates and version boundaries follow the in-app changelog. Symbol names refer to
`src/lib/faucet.ts` and `src/lib/faucet-api.ts` unless noted.

## Upgrading from 1.3

Run migrations `0023`–`0025` before deploying. `npm run build` applies them
when `DATABASE_URL` is set. Boot also runs idempotent schema guards
(`ensureGraceSchema`, `ensureHallowSchema`, `ensureFillBlockSchema`) that add
missing columns and run one-time backfills gated by flags on `faucet_pool`.

## [1.5.2] - 2026-11-20

### Added
- Country block: `src/lib/geo-block.ts` (`BLOCKED_COUNTRIES`, `isBlockedCountry`,
  `GEO_BLOCKED_MESSAGE`) with tests in `geo-block.test.ts`. Defaults to `RU`
  and `KP`. `createChallenge` and `claimSats` call `clientCountry()` (the
  `x-vercel-ip-country` header, set by Vercel) and refuse before any database
  work or payout. A missing header is treated as not blocked, so local dev works.

### Fixed
- End-of-day jackpot window. `claimSats` rolled a pour, and `reservePour`
  refused any non-jackpot pour that would push the day's ordinary total past
  `dailyPourBudget`, while a jackpot skipped that check. When less than the
  smallest ordinary pour was left, every ordinary roll was refused and the only
  roll that could succeed was the jackpot. The progress bar made the window
  visible, and refused attempts cost only a puzzle, so people waited and
  retried. Now `claimSats` computes `dayOrdinaryRoom` up front, rests the day
  for everyone once less than `MIN_CLAIM_SATS` is left (`dayHasRoom`), and
  shrinks an ordinary pour to the room left (`fitOrdinaryPour`) instead of
  refusing it, relabelling its tier with `tierForAmount`. The jackpot roll is
  unchanged. `reservePour` still enforces the cap as a race backstop. Covered
  by `lib/faucet-day.test.ts`.

### Changed
- Legacy closed for good: `LEGACY_LIMIT` in `lib/faucet.ts` is now `0` (was
  `100`). The award in `claimSats` (`legacy_awarded < LEGACY_LIMIT`) never
  matches, and the backfill in `ensureLegacySchema` has no slots left, so a
  fresh database cannot hand the badge out again. Existing `is_legacy` rows
  are untouched and stay on the board. `lib/legacy-closed.test.ts` guards the
  value. FAQ (English and Spanish, `faq.legacy.body`) and Terms reworded.
- Dolphin tier icon (`DolphinIcon` in `components/leaderboard.tsx`) replaced
  with a 24x24 stroke icon (six paths, `stroke="currentColor"`, width 2, round
  caps and joins). It renders through `AnimalMark` like the Fish and Whale
  icons, so size and the circle behind it are unchanged. Supersedes the
  1.5.1 pixel-art dolphin.
- `clientIp()` no longer trusts `cf-connecting-ip`. With DNS-only Cloudflare
  anyone could send that header and get a new identity per request, which
  weakened the per-IP limits. Order is now `x-vercel-forwarded-for`,
  `x-real-ip`, then the last `x-forwarded-for` entry. If the site is ever
  proxied through Cloudflare, revisit this.
- Privacy and Terms (effective 2026-11-20): name Vercel, Neon and Cloudflare,
  describe the country check, add an 18+ rule, the sanctions rule and a VPN
  clause. Version labels bumped to v1.5.2.

## [1.5.1] - 2026-11-09

### Added
- "Good to know" page (`routes/know.tsx`, `know.*` keys in `lib/copy.ts`, English
  and Spanish) for people new to bitcoin: do not leave a stack on an exchange or
  in a hot wallet, and Lightning here is spending money, not a vault. Linked
  from the footer.

### Fixed
- Wallet host failures are no longer reported as a bad address
  (`lib/lightning-body.ts`). `parseLightningBody` returns `undefined` for a
  non-JSON body such as an HTML error page, and `invoiceFailureMessage` maps
  that to `INVOICE_PAGE` ("That wallet sent a page instead of an invoice. The
  address was not rejected."). `lnurlProblem` maps LUD-06 `ERROR` replies:
  an unknown user becomes `ADDRESS_MISSING`, an amount complaint gets its own
  message, and anything else becomes `INVOICE_SOFT`.
- Payout failures say what happened (`payFailureMessage`). An empty or
  unreachable spring wallet returns `WALLET_LOW` or `PAY_OFFLINE`, and a slow
  wallet returns `PAY_SLOW`. Each message states that the visitor's address is
  fine. Covered by `lib/lightning-body.test.ts`.
- Falling coins in `components/faucet-well.tsx` (`.drip-coin` in `styles.css`)
  animate again. After the Hallow season closed they sat still at the spout and
  now drop into the basin.
- The dolphin tier mark in `components/leaderboard.tsx` (`DolphinIcon`) now
  draws a dolphin: beak, dorsal fin and tail.

## [1.5.0] - 2026-10-24

### Added
- Keeper watch: `getKeeperWatch` server fn, `KeeperWatch` / `WatchDay` /
  `WatchPour` / `WatchCluster` types, `components/keeper-watch.tsx`. Keeper-only.
  Per-day counts of pours, addresses, connections and first drinks, plus
  clusters of connections that drank from three or more addresses. A connection
  tag is the start of a hash, never the raw IP.
- Farm limit: `FARM_ADDRESS_CAP = 2` other paid addresses per connection over
  14 days. A third new address is rejected. Addresses that already drank are
  unaffected.
- `farmPuzzleBits(base, siblings, fresh)`: new addresses on a busy connection
  solve a heavier puzzle (+1 / +2 / +3 bits, capped at 22).
- `freshDayBudget()`: first drinks share `FRESH_DAY_SHARE` (1/3) of the day's
  ordinary budget. The rest is reserved for known addresses.
- `rollPour(maxPayable, streak, allowJackpot, commonOnly)`: new addresses roll
  from the common band only and cannot hit the jackpot.

## [1.4.9] - 2026-10-20

### Changed
- `POW_DIFFICULTY` 18 → 19 (`lib/pow.ts`).
- Halloween badge now requires `HALLOW_STREAK_DAYS = 3` consecutive paid UTC
  days inside October (`hallowPaidRun`, `isHallowSeason`). Pre-October streaks
  do not count. Held (unpaid) days do not count.
- One-time cleanup passes, each gated by a `faucet_pool` flag:
  `undoOneDrinkHallow` (`hallow_one_undone`), `stripHallowOutsideOctober`
  (`hallow_october_only`), `grantOctoberHallow` (`hallow_october_grant`),
  `stripHallowWithoutPaidRun` (`hallow_paid_only`). Marks that never met the
  rule are removed and valid ones restored.

### Added
- Share-link preview card.

## [1.4.8] - 2026-10-17

### Changed
- `dailyCapApplies()` is false below `SMALL_POT_FREE = 1_000` sats, so a tiny
  pot can be emptied. At or above the threshold the daily cap applies.

## [1.4.7] - 2026-10-16

### Added
- One jackpot per UTC day. Jackpot payouts are excluded from the ordinary
  daily cap (`paid.ordinary` vs `paid.all`). Keeper shows a separate bar and a
  reset countdown. `dayJackpotClaimed` / `dayJackpotSats` on the wallet status.
- Countdown to 31 October until the window closes.

### Changed
- Pour reservation is transactional. The reserve step runs in
  `sql.transaction` with `SELECT ... FOR UPDATE` on `faucet_pool`, checks the
  daily cap, decrements `balance_sats` / `wallet_sats` and inserts the claim
  before the Lightning payment is sent. `undoPourReserve()` restores the pot if
  the payment fails, so concurrent requests cannot spend the same sats twice.
- `db.ts`: `Sql.transaction(fn)` on both backends (pg Pool with
  BEGIN/COMMIT/ROLLBACK, PGlite native transaction).
- `clientIp()` resolves the address from the host's headers in order:
  `cf-connecting-ip`, first `x-vercel-forwarded-for`, `x-real-ip`, last
  `x-forwarded-for` entry. Per-connection limits key on this, so a visitor
  cannot mint a new connection with a spoofed header.

## [1.4.6] - 2026-10-14

### Changed
- `DAILY_POT_SLICE` 0.15 → 0.30. Keeper cap bar added. Jackpots excluded from
  the cap.

## [1.4.5] - 2026-10-13

### Added
- Halloween event: `faucet_drinkers.is_hallow`, `hallowOpen` on pool state,
  `hallow` / `hallowDays` on leaderboard and drinker types, `hallowProgress()`.
  Closes 1 November. Badges persist.
- Keeper address blocklist: `faucet_fill_blocks` (`address_norm`,
  `address_hash`), `normFillAddress()`, `isFillHashBlocked()`,
  `refuseBlockedFill()`. Blocked addresses cannot fill. Drinking is unaffected.
  The list starts empty.

### Fixed
- Pressing pour on a dry day no longer revives a broken streak
  (`trustedLastDrink()` checks the last paid day, not the last held day).

## [1.4.1] - 2026-09-03

### Changed
- Streak boost on ordinary sips: `payoutBoostPct()` is +1% per day, capped at
  +25% (`boostNormalPour`). Streak also multiplies jackpot odds by up to 1.5×
  (`JACKPOT_STREAK_PER_DAY = 0.01`, `JACKPOT_STREAK_CAP = 0.5`).
- Jackpot odds are expected-value based. `jackpotChance(streak, potSats)`
  targets `JACKPOT_EV_SATS = 80`, clamped to `[0.002, 0.05]`, so a fat well
  gets rarer, larger jackpots. Jackpot stays 10% of the live pot.
- `pourSchedule()`: ordinary sips scale with `SIP_SQRT_K * sqrt(pot)` and are
  capped at `SIP_JACKPOT_SHARE = 0.45` of the jackpot. Band floor is
  `MIN_CLAIM_SATS`.
- Daily cap replaces the flat `MAX_SATS_PER_DAY`: `dailyPourBudget()` is
  `DAILY_POT_SLICE` (0.15 at this version) of the pot.
- `IP_DRINKS_PER_DAY` 4 → 2.
- Streak board (`streakBoardSince`) lists every live streak, including day one.

## [1.4.0] - 2026-09-03

### Added
- EN/ES switch: `lib/i18n.tsx`, `lib/copy.ts`, `Lang = "en" | "es"`,
  `LANG_KEY = "fountain-lang"`. `formatSats(n, locale)`.
- Embed and public API: `routes/embed.tsx` (`/embed`, `?widget=1`),
  `components/pot-badge.tsx`, `routes/api/pot.ts` (`GET /api/pot`, `OPTIONS`
  preflight). Response headers: `Access-Control-Allow-Origin: *`,
  `Cache-Control: public, max-age=20`. Body is `PublicPot`: `balance`,
  `jackpotSats`, `claimCount`, `flowing`, `sealed`, `maintenance`, `updatedAt`.
- Grace day: `GRACE_EVERY = 7`, `faucet_drinkers.grace_token`. One miss spends
  the token, two misses wipe the streak. Re-earned at 14, 21, and so on.
  `shouldBackfillGrace()` + `backfillGraceOnce()` grant one token to live 7+ day
  streaks, once (`grace_backfilled`).
- Dry-pot freeze: days the spring cannot pay do not break streaks.
  `withDryFreeze()` folds `spring_dry_from` / `spring_dry_log` into the same
  freeze math as maintenance. `StreakFreeze.ranges` / `freezeRanges()` keep
  earlier closed windows. Pressing pour on a dry day holds the streak without
  paying sats or spending grace.

### Migrations
- `0023_grace_token.sql`: `faucet_drinkers.grace_token boolean`.
- `0024_grace_backfill.sql`: `faucet_pool.grace_backfilled boolean`,
  `streak_freeze_log jsonb`.
- `0025_dry_freeze.sql`: `faucet_pool.spring_dry_from text`,
  `spring_dry_log jsonb`.

## [1.3] - 2026-09-01

Baseline for this changelog.

- Basin: all-time leaderboard of fills by sats.
- Fill notice on the fountain. Paid fills list on the basin even if the invoice
  sheet is closed.
- Drink flow discloses the proof-of-work step, shows progress, can be cancelled.
- "Resting until tomorrow" uses the UTC day, not a rolling 24 h.
- `MAX_CLAIMS_PER_DAY` 200 → 500.
- `POUR_1000` badge for the 1,000th paid pour.
- Jackpot 5% → 10% of the pot, odds unchanged.
- `IP_DRINKS_PER_DAY` 8 → 4.
- Dolphin tier at 5,000 lifetime sats.
