import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";
import {
  COOLDOWN_MS,
  DEST_COOLDOWN_MS,
  IP_COOLDOWN_MS,
  IP_DRINKS_PER_DAY,
  LEGACY_LIMIT,
  POUR_500,
  POUR_1000,
  MAX_CLAIMS_PER_DAY,
  MAX_FUND_SATS,
  MAX_POOL_SATS,
  MAX_SATS_PER_DAY,
  MAX_TIP_SATS,
  MIN_CLAIM_SATS,
  MIN_FUND_SATS,
  MIN_TIP_SATS,
  TIP_COOLDOWN_MS,
  animalTier,
  asPourTier,
  classifyDestination,
  donorTier,
  isClaimableLightning,
  jackpotBoostPct,
  jackpotSatsForPot,
  liveStreak,
  maskDestination,
  nextStreak,
  parseUsername,
  rollPour,
  utcDateString,
  utcDayStart,
  utcYesterday,
  isStrongKeeperPhrase,
  type AnimalTier,
  type ClaimResult,
  type DepositInvoice,
  type DonorEntry,
  type DrinkerPreview,
  type FaucetState,
  type LeaderEntry,
  type RecentPour,
  type StreakFreeze,
  type WalletKind,
  type WalletStatus,
} from "@/lib/faucet";
import { POW_DIFFICULTY, POW_TTL_MS, leadingZeroBits, powPayload } from "@/lib/pow";

type PoolRow = {
  balance_sats: number;
  total_funded_sats: number;
  total_claimed_sats: number;
  claim_count: number;
  fund_count: number;
  wallet_kind: string | null;
  wallet_sats: number | null;
  tip_ln_address: string | null;
  legacy_awarded: number | null;
  maintenance: boolean | null;
  streak_freeze_from: string | null;
  streak_freeze_until: string | null;
};

type ClaimRow = {
  id: number;
  amount_sats: number;
  destination_kind: string;
  destination_mask: string;
  created_at: Date | string;
  paid: boolean;
  pour_tier: string | null;
  username: string | null;
};

type DrinkerRow = {
  destination_mask: string;
  username: string | null;
  total_sats: number;
  drink_count: number;
  current_streak: number;
  last_drink_utc: string | null;
  is_legacy: boolean;
  legacy_rank: number | null;
  is_pour_500: boolean;
  is_pour_1000: boolean;
};

/** SHA-256 of `fountain:${phrase}`. Set in the environment. Never commit it. */
const KEEPER_HASH = (process.env.KEEPER_HASH ?? "").trim().toLowerCase();

function publicWalletError(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : fallback;
  if (/invalid nwc|invalid secret/i.test(message)) {
    return "That NWC string is not valid.";
  }
  if (/timeout|did not answer|network|econnrefused|enotfound/i.test(message)) {
    return "The wallet did not answer. Check the connection and try again.";
  }
  return message || fallback;
}

async function hashToken(token: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(`fountain:${token}`).digest("hex");
}

async function hashKeeper(phrase: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(`fountain:${phrase.trim()}`).digest("hex");
}

/** First few misses are free (fat fingers); after that the wait doubles each miss. */
const KEEPER_FREE_ATTEMPTS = 3;
const KEEPER_LOCK_BASE_MS = 5_000;
const KEEPER_LOCK_MAX_MS = 30 * 60_000;

type KeeperCheck = { ok: boolean; error?: string; retryAfterMs?: number };

async function hashKeeperIp(ip: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(`keeper-ip:${ip}`).digest("hex");
}

async function ensureKeeperAttemptSchema(sql: Sql): Promise<void> {
  await sql.query(`
    create table if not exists faucet_keeper_attempts (
      ip_hash text primary key,
      fail_count integer not null default 0,
      locked_until timestamptz,
      updated_at timestamptz not null default now()
    )
  `);
}

function keeperLockMs(failCount: number): number {
  if (failCount <= KEEPER_FREE_ATTEMPTS) return 0;
  const steps = failCount - KEEPER_FREE_ATTEMPTS;
  return Math.min(KEEPER_LOCK_MAX_MS, KEEPER_LOCK_BASE_MS * 2 ** (steps - 1));
}

const LOCKED_MESSAGE = "Too many attempts. The spring has sealed itself for a while.";

async function keeperMatches(phrase: string): Promise<KeeperCheck> {
  const sql = await getSql();
  await ensureKeeperAttemptSchema(sql);
  const ipHash = await hashKeeperIp(await clientIp());

  const row = (
    await sql<{ fail_count: number; locked_until: Date | string | null }>`
    select fail_count, locked_until from faucet_keeper_attempts
    where ip_hash = ${ipHash}
  `
  )[0];
  if (row?.locked_until) {
    const remaining = new Date(row.locked_until).getTime() - Date.now();
    if (remaining > 0) {
      return { ok: false, error: LOCKED_MESSAGE, retryAfterMs: remaining };
    }
  }

  await sql.query(
    "alter table faucet_pool add column if not exists keeper_hash text",
  );
  if (/^[0-9a-f]{64}$/.test(KEEPER_HASH)) {
    await sql.query(
      "update faucet_pool set keeper_hash = $1 where id = 1 and (keeper_hash is null or keeper_hash = '')",
      [KEEPER_HASH],
    );
  }
  const expected = (
    await sql<{ keeper_hash: string | null }>`
    select keeper_hash from faucet_pool where id = 1
  `
  )[0]?.keeper_hash;

  let matched = false;
  if (expected) {
    const got = await hashKeeper(phrase);
    const { timingSafeEqual } = await import("node:crypto");
    const { Buffer } = await import("node:buffer");
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(got, "hex");
    matched = a.length === b.length && timingSafeEqual(a, b);
  }

  if (matched) {
    await sql`delete from faucet_keeper_attempts where ip_hash = ${ipHash}`;
    return { ok: true };
  }

  const nextFail = Number(row?.fail_count ?? 0) + 1;
  const lockMs = keeperLockMs(nextFail);
  const lockedUntil = lockMs > 0 ? new Date(Date.now() + lockMs) : null;
  await sql`
    insert into faucet_keeper_attempts (ip_hash, fail_count, locked_until)
    values (${ipHash}, ${nextFail}, ${lockedUntil})
    on conflict (ip_hash) do update set
      fail_count = ${nextFail},
      locked_until = ${lockedUntil},
      updated_at = now()
  `;
  return lockMs > 0
    ? { ok: false, error: LOCKED_MESSAGE, retryAfterMs: lockMs }
    : { ok: false, error: "Not the keeper." };
}

function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function asWalletKind(value: string | null): WalletKind | null {
  if (value === "nwc" || value === "lnbits") return value;
  return null;
}

function toLeader(row: DrinkerRow, freeze?: StreakFreeze | null): LeaderEntry {
  const total = Number(row.total_sats);
  return {
    mask: row.destination_mask,
    username: row.username?.trim() || null,
    totalSats: total,
    streak: liveStreak(Number(row.current_streak), row.last_drink_utc, new Date(), freeze),
    drinks: Number(row.drink_count),
    tier: animalTier(total),
    legacy: Boolean(row.is_legacy),
    legacyRank: row.legacy_rank != null ? Number(row.legacy_rank) : null,
    pour500: Boolean(row.is_pour_500),
    pour1000: Boolean(row.is_pour_1000),
  };
}

async function ensureStreakSchema(sql: Sql): Promise<void> {
  await sql.query(`
    create table if not exists faucet_drinkers (
      destination_hash text primary key,
      destination_mask text not null,
      total_sats integer not null default 0,
      drink_count integer not null default 0,
      current_streak integer not null default 0,
      last_drink_utc text,
      updated_at timestamptz not null default now()
    )
  `);
}

async function ensureLegacySchema(sql: Sql): Promise<void> {
  await sql.query(
    "alter table faucet_drinkers add column if not exists is_legacy boolean not null default false",
  );
  await sql.query(
    "alter table faucet_drinkers add column if not exists legacy_rank integer",
  );
  await sql.query(
    "alter table faucet_pool add column if not exists legacy_awarded integer not null default 0",
  );
  await sql.query(`
    with ranked as (
      select destination_hash,
             row_number() over (order by updated_at asc) as rn
      from faucet_drinkers
      where total_sats > 0 and is_legacy = false
    ),
    cap as (
      select greatest(
        0,
        ${LEGACY_LIMIT} - coalesce(
          (select legacy_awarded from faucet_pool where id = 1),
          0
        )
      ) as slots_left
    )
    update faucet_drinkers d
    set
      is_legacy = true,
      legacy_rank = coalesce(
        (select legacy_awarded from faucet_pool where id = 1),
        0
      ) + r.rn
    from ranked r, cap
    where d.destination_hash = r.destination_hash
      and r.rn <= cap.slots_left
  `);
  await sql.query(`
    update faucet_pool
    set legacy_awarded = (
      select count(*)::int from faucet_drinkers where is_legacy = true
    )
    where id = 1
  `);
}

async function ensurePour500Schema(sql: Sql): Promise<void> {
  await sql.query(
    "alter table faucet_drinkers add column if not exists is_pour_500 boolean not null default false",
  );
  await sql.query(`
    create unique index if not exists faucet_drinkers_pour_500_idx
    on faucet_drinkers (is_pour_500)
    where is_pour_500
  `);
}

async function assignPour500(sql: Sql): Promise<void> {
  await ensurePour500Schema(sql);
  await sql.query(`
    with ranked as (
      select destination_hash
      from faucet_claims
      where paid = true and destination_hash is not null
      order by created_at asc, id asc
      offset ${POUR_500 - 1} limit 1
    )
    update faucet_drinkers d
    set is_pour_500 = true
    from ranked
    where d.destination_hash = ranked.destination_hash
      and not exists (select 1 from faucet_drinkers x where x.is_pour_500 = true)
  `);
}

async function ensurePour1000Schema(sql: Sql): Promise<void> {
  await sql.query(
    "alter table faucet_drinkers add column if not exists is_pour_1000 boolean not null default false",
  );
  await sql.query(`
    create unique index if not exists faucet_drinkers_pour_1000_idx
    on faucet_drinkers (is_pour_1000)
    where is_pour_1000
  `);
}

async function assignPour1000(sql: Sql): Promise<void> {
  await ensurePour1000Schema(sql);
  await sql.query(`
    with ranked as (
      select destination_hash
      from faucet_claims
      where paid = true and destination_hash is not null
      order by created_at asc, id asc
      offset ${POUR_1000 - 1} limit 1
    )
    update faucet_drinkers d
    set is_pour_1000 = true
    from ranked
    where d.destination_hash = ranked.destination_hash
      and not exists (select 1 from faucet_drinkers x where x.is_pour_1000 = true)
  `);
}

async function ensureTipAddressSchema(sql: Sql): Promise<void> {
  await sql.query(
    "alter table faucet_pool add column if not exists tip_ln_address text",
  );
}

async function ensurePourTierSchema(sql: Sql): Promise<void> {
  await sql.query(
    "alter table faucet_claims add column if not exists pour_tier text",
  );
  await sql.query(`
    update faucet_claims
    set pour_tier = case
      when amount_sats >= 2100 then 'jackpot'
      when amount_sats >= 500 then 'rare'
      when amount_sats >= 100 then 'uncommon'
      else 'common'
    end
    where pour_tier is null
  `);
}

async function ensureDonorSchema(sql: Sql): Promise<void> {
  await sql.query(
    "alter table faucet_deposits add column if not exists dest_mask text",
  );
  await sql.query(`
    create table if not exists faucet_donors (
      destination_hash text primary key,
      destination_mask text not null,
      total_sats integer not null default 0,
      fill_count integer not null default 0,
      updated_at timestamptz not null default now()
    )
  `);
  await sql.query(
    "alter table faucet_donors add column if not exists listed boolean not null default true",
  );
  await sql.query(
    "alter table faucet_deposits add column if not exists listed boolean not null default true",
  );
  await sql.query(
    "alter table faucet_pool add column if not exists basin_unlisted_10k boolean not null default false",
  );
  await sql.query(`
    update faucet_donors
    set listed = false
    where total_sats = 10000
      and fill_count = 1
      and listed = true
      and exists (
        select 1 from faucet_pool where id = 1 and basin_unlisted_10k = false
      )
  `);
  await sql.query(`
    update faucet_deposits
    set listed = false
    where is_public = true
      and paid = true
      and amount_sats = 10000
      and listed = true
      and exists (
        select 1 from faucet_pool where id = 1 and basin_unlisted_10k = false
      )
  `);
  await sql.query(`
    update faucet_pool
    set basin_unlisted_10k = true
    where id = 1
  `);
}

async function recordDonor(
  sql: Sql,
  destHash: string,
  destMask: string,
  amount: number,
): Promise<void> {
  if (!destHash || !destMask || amount < 1) return;
  await sql`
    insert into faucet_donors (
      destination_hash, destination_mask, total_sats, fill_count, listed
    )
    values (${destHash}, ${destMask}, ${amount}, ${1}, ${true})
    on conflict (destination_hash) do update set
      destination_mask = excluded.destination_mask,
      total_sats = faucet_donors.total_sats + excluded.total_sats,
      fill_count = faucet_donors.fill_count + 1,
      updated_at = now()
    where faucet_donors.listed = true
  `;
}

/** Rebuild listed basin rows from paid public fills. Hidden rows stay hidden. */
async function syncDonorsFromFills(sql: Sql): Promise<void> {
  await sql.query(`
    insert into faucet_donors (
      destination_hash, destination_mask, total_sats, fill_count, listed
    )
    select
      dest_hash,
      min(dest_mask),
      sum(amount_sats)::int,
      count(*)::int,
      true
    from faucet_deposits
    where is_public = true
      and paid = true
      and dest_hash is not null
      and dest_mask is not null
      and listed = true
    group by dest_hash
    on conflict (destination_hash) do update set
      destination_mask = excluded.destination_mask,
      total_sats = excluded.total_sats,
      fill_count = excluded.fill_count,
      updated_at = now()
    where faucet_donors.listed = true
  `);
}

async function creditPublicTip(
  sql: Sql,
  checkingId: string,
  paidAmount: number,
): Promise<number | null> {
  const claimed = (
    await sql<{
      amount_sats: number;
      dest_hash: string | null;
      dest_mask: string | null;
    }>`
      update faucet_deposits
      set paid = true, paid_at = now()
      where checking_id = ${checkingId} and paid = false and is_public = true
      returning amount_sats, dest_hash, dest_mask
    `
  )[0];
  if (!claimed) return null;
  const credit = Math.min(
    paidAmount > 0 ? paidAmount : Number(claimed.amount_sats),
    MAX_TIP_SATS,
  );
  await sql`
    update faucet_pool
    set
      balance_sats = least(${MAX_POOL_SATS}, balance_sats + ${credit}),
      total_funded_sats = total_funded_sats + ${credit},
      fund_count = fund_count + 1,
      wallet_sats = wallet_sats + ${credit}
    where id = 1
  `;
  await sql`insert into faucet_funds (amount_sats) values (${credit})`;
  if (claimed.dest_hash && claimed.dest_mask) {
    await recordDonor(sql, claimed.dest_hash, claimed.dest_mask, credit);
  }
  return credit;
}

async function settleOpenPublicTips(sql: Sql): Promise<void> {
  await sql.query(
    "alter table faucet_pool add column if not exists tip_settle_at timestamptz",
  );
  const gotLock = (
    await sql<{ id: number }>`
      update faucet_pool
      set tip_settle_at = now()
      where id = 1
        and (tip_settle_at is null or tip_settle_at < now() - interval '20 seconds')
      returning id
    `
  )[0];
  if (!gotLock) return;
  const lightning = await import("@/lib/lightning.server");
  const wallet = await lightning.loadWallet();
  if (!wallet) return;
  const open = await sql<{ checking_id: string }>`
    select checking_id from faucet_deposits
    where is_public = true and paid = false
      and created_at > now() - interval '48 hours'
    order by created_at desc
    limit 8
  `;
  for (const row of open) {
    try {
      const lookup = await lightning.lookupDepositPaid(
        wallet.blob,
        row.checking_id,
      );
      if (!lookup.paid) continue;
      await creditPublicTip(sql, row.checking_id, lookup.amountSats);
    } catch {
      /* leave this invoice for the next pass */
    }
  }
}

async function readDonors(sql: Sql): Promise<DonorEntry[]> {
  const rows = await sql<{
    destination_mask: string;
    total_sats: number;
    fill_count: number;
  }>`
    select destination_mask, total_sats, fill_count
    from faucet_donors
    where total_sats > 0 and listed = true
    order by total_sats desc, fill_count desc
    limit 12
  `;
  return rows.map((row) => {
    const total = Number(row.total_sats);
    return {
      mask: row.destination_mask,
      totalSats: total,
      fills: Number(row.fill_count),
      tier: donorTier(total),
    };
  });
}

async function readRecentFills(sql: Sql): Promise<
  { id: number; amount: number; mask: string; createdAt: string }[]
> {
  const rows = await sql<{
    id: number;
    amount_sats: number;
    dest_mask: string | null;
    paid_at: Date | string;
  }>`
    select id, amount_sats, dest_mask, paid_at
    from faucet_deposits
    where is_public = true and paid = true and dest_mask is not null and listed = true
    order by paid_at desc
    limit 20
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    amount: Number(row.amount_sats),
    mask: row.dest_mask ?? "someone",
    createdAt: toIso(row.paid_at),
  }));
}

async function ensureUsernameSchema(sql: Sql): Promise<void> {
  await sql.query(
    "alter table faucet_drinkers add column if not exists username text",
  );
  await sql.query(`
    create unique index if not exists faucet_drinkers_username_idx
    on faucet_drinkers (username)
    where username is not null
  `);
}

async function ensureDayLockSchema(sql: Sql): Promise<void> {
  await sql.query(`
    create table if not exists faucet_day_locks (
      kind text not null,
      lock_hash text not null,
      drink_utc text not null,
      hits integer not null default 1,
      created_at timestamptz not null default now(),
      primary key (kind, lock_hash, drink_utc)
    )
  `);
  await sql.query(
    "alter table faucet_day_locks add column if not exists hits integer not null default 1",
  );
}

async function takeDayLock(
  sql: Sql,
  kind: string,
  lockHash: string,
  drinkUtc: string,
  maxHits = 1,
): Promise<boolean> {
  const row = (
    await sql<{ hits: number }>`
    insert into faucet_day_locks (kind, lock_hash, drink_utc, hits)
    values (${kind}, ${lockHash}, ${drinkUtc}, 1)
    on conflict (kind, lock_hash, drink_utc) do update
      set hits = faucet_day_locks.hits + 1
      where faucet_day_locks.hits < ${maxHits}
    returning hits
  `
  )[0];
  return Boolean(row);
}

async function holdStreakForCap(
  sql: Sql,
  destHash: string,
  restMessage: string,
): Promise<ClaimResult> {
  const today = utcDateString();
  const known = (
    await sql<{ destination_hash: string }>`
      select destination_hash from faucet_drinkers
      where destination_hash = ${destHash}
      limit 1
    `
  )[0];
  if (!known) {
    return { ok: false, error: restMessage };
  }
  await sql`
    update faucet_drinkers
    set last_drink_utc = ${today}, updated_at = now()
    where destination_hash = ${destHash}
  `;
  return {
    ok: false,
    error: `${restMessage} Your streak is held.`,
  };
}

async function releaseDayLock(
  sql: Sql,
  kind: string,
  lockHash: string,
  drinkUtc: string,
): Promise<void> {
  const row = (
    await sql<{ hits: number }>`
    update faucet_day_locks
    set hits = hits - 1
    where kind = ${kind} and lock_hash = ${lockHash} and drink_utc = ${drinkUtc}
      and hits > 0
    returning hits
  `
  )[0];
  if (!row || Number(row.hits) <= 0) {
    await sql`
      delete from faucet_day_locks
      where kind = ${kind} and lock_hash = ${lockHash} and drink_utc = ${drinkUtc}
        and hits <= 0
    `;
  }
}

async function ensureMaintenanceSchema(sql: Sql): Promise<void> {
  await sql.query(`
    alter table faucet_pool add column if not exists maintenance boolean not null default false
  `);
  await sql.query(`
    alter table faucet_pool add column if not exists streak_freeze_from text
  `);
  await sql.query(`
    alter table faucet_pool add column if not exists streak_freeze_until text
  `);
  const today = utcDateString();
  await sql`
    update faucet_pool
    set
      maintenance = true,
      streak_freeze_from = ${today},
      streak_freeze_until = null
    where id = 1 and streak_freeze_from is null
  `;
}

async function loadFreeze(
  sql: Sql,
): Promise<{ maintenance: boolean; freeze: StreakFreeze }> {
  await ensureMaintenanceSchema(sql);
  const row = (
    await sql<{
      maintenance: boolean;
      streak_freeze_from: string | null;
      streak_freeze_until: string | null;
    }>`
    select maintenance, streak_freeze_from, streak_freeze_until
    from faucet_pool
    where id = 1
  `
  )[0];
  return {
    maintenance: Boolean(row?.maintenance),
    freeze: {
      from: row?.streak_freeze_from ?? null,
      until: row?.streak_freeze_until ?? null,
    },
  };
}

async function ensurePaidPoursOnly(sql: Sql): Promise<void> {
  await sql`
    delete from faucet_claims
    where claim_token_hash = 'seed'
       or (coalesce(paid, false) = false and destination_hash is null)
  `;
}

async function clientIp(): Promise<string> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const headers = getRequest()?.headers;
    const cf = headers?.get("cf-connecting-ip");
    const vercel = headers?.get("x-vercel-forwarded-for");
    const real = headers?.get("x-real-ip");
    const xff = headers?.get("x-forwarded-for");
    return (
      cf?.trim() ||
      vercel?.split(",")[0]?.trim() ||
      real?.trim() ||
      xff?.split(",")[0]?.trim() ||
      "unknown"
    ).slice(0, 80);
  } catch {
    return "unknown";
  }
}

async function verifyPow(
  id: string,
  nonce: number,
  difficulty: number,
): Promise<boolean> {
  const { createHash } = await import("node:crypto");
  const digest = createHash("sha256").update(powPayload(id, nonce)).digest();
  return leadingZeroBits(digest) >= difficulty;
}

function retryMs(createdAt: Date | string, windowMs: number): number {
  const then = new Date(createdAt).getTime();
  return Math.max(0, windowMs - (Date.now() - then));
}

async function readBoards(
  sql: Sql,
  freeze?: StreakFreeze | null,
): Promise<{
  boardSats: LeaderEntry[];
  boardStreak: LeaderEntry[];
}> {
  const bySats = await sql<DrinkerRow>`
    select destination_mask, username, total_sats, drink_count, current_streak, last_drink_utc,
           is_legacy, legacy_rank, is_pour_500, is_pour_1000
    from faucet_drinkers
    where total_sats > 0
    order by total_sats desc, drink_count desc
    limit 12
  `;
  const byStreak = await sql<DrinkerRow>`
    select destination_mask, username, total_sats, drink_count, current_streak, last_drink_utc,
           is_legacy, legacy_rank, is_pour_500, is_pour_1000
    from faucet_drinkers
    where current_streak > 0
    order by current_streak desc, total_sats desc
    limit 12
  `;
  return {
    boardSats: bySats.map((row) => toLeader(row, freeze)),
    boardStreak: byStreak
      .map((row) => toLeader(row, freeze))
      .filter((row) => row.streak > 0)
      .sort((a, b) => b.streak - a.streak || b.totalSats - a.totalSats)
      .slice(0, 10),
  };
}

async function readPool(): Promise<FaucetState> {
  const sql = await getSql();
  const lightning = await import("@/lib/lightning.server");
  await lightning.ensureLightningSchema(sql);
  await ensureStreakSchema(sql);
  await ensureLegacySchema(sql);
  await assignPour500(sql);
  await assignPour1000(sql);
  await ensureTipAddressSchema(sql);
  await ensurePourTierSchema(sql);
  await ensureDonorSchema(sql);
  await settleOpenPublicTips(sql);
  await syncDonorsFromFills(sql);
  await ensureUsernameSchema(sql);
  await ensurePaidPoursOnly(sql);
  await ensureMaintenanceSchema(sql);

  const pools = await sql<PoolRow>`
    select
      balance_sats,
      total_funded_sats,
      total_claimed_sats,
      claim_count,
      fund_count,
      wallet_kind,
      wallet_sats,
      tip_ln_address,
      legacy_awarded,
      maintenance,
      streak_freeze_from,
      streak_freeze_until
    from faucet_pool
    where id = 1
  `;
  const pool = pools[0];
  if (!pool) {
    throw new Error("Faucet pool is not initialized.");
  }

  const walletKind = asWalletKind(pool.wallet_kind);
  const walletConnected = walletKind !== null;
  const balance = walletConnected ? Number(pool.balance_sats) : 0;
  const walletSats = Number(pool.wallet_sats ?? 0);
  const payable =
    walletConnected && walletSats >= MIN_CLAIM_SATS
      ? Math.min(balance, walletSats)
      : balance;

  const rows = await sql<ClaimRow>`
    select
      c.id, c.amount_sats, c.destination_kind, c.destination_mask, c.created_at, c.paid, c.pour_tier,
      d.username
    from faucet_claims c
    left join faucet_drinkers d on d.destination_hash = c.destination_hash
    where c.paid = true
    order by c.created_at desc, c.id desc
    limit 14
  `;

  const recent: RecentPour[] = rows.map((row) => ({
    id: Number(row.id),
    amount: Number(row.amount_sats),
    mask: row.destination_mask,
    username: row.username?.trim() || null,
    kind: row.destination_kind === "onchain" ? "onchain" : "lightning",
    createdAt: toIso(row.created_at),
    paid: Boolean(row.paid),
    tier: asPourTier(row.pour_tier, Number(row.amount_sats)),
  }));

  const paidStats = await sql<{ n: number; s: number }>`
    select
      count(*)::int as n,
      coalesce(sum(amount_sats), 0)::int as s
    from faucet_claims
    where paid = true
  `;
  const boards = await readBoards(sql, {
    from: pool.streak_freeze_from ?? null,
    until: pool.streak_freeze_until ?? null,
  });
  const boardDonors = await readDonors(sql);
  const recentFills = await readRecentFills(sql);

  return {
    balance,
    totalFunded: Number(pool.total_funded_sats),
    totalClaimed: Number(paidStats[0]?.s ?? 0),
    claimCount: Number(paidStats[0]?.n ?? 0),
    fundCount: Number(pool.fund_count),
    recent,
    walletConnected,
    walletKind,
    jackpotSats: walletConnected ? jackpotSatsForPot(payable) : 0,
    boardSats: boards.boardSats,
    boardStreak: boards.boardStreak,
    boardDonors,
    recentFills,
    tipLnAddress: pool.tip_ln_address?.trim() || null,
    legacyAwarded: Math.min(
      LEGACY_LIMIT,
      Math.max(0, Number(pool.legacy_awarded ?? 0)),
    ),
    pour500Awarded: Boolean(
      (
        await sql<{ n: number }>`
        select count(*)::int as n from faucet_drinkers where is_pour_500 = true
      `
      )[0]?.n,
    ),
    pour1000Awarded: Boolean(
      (
        await sql<{ n: number }>`
        select count(*)::int as n from faucet_drinkers where is_pour_1000 = true
      `
      )[0]?.n,
    ),
    maintenance: Boolean(pool.maintenance),
  };
}

export const getFaucetState = createServerFn({ method: "GET" }).handler(
  async (): Promise<FaucetState> => {
    return readPool();
  },
);

export const lookupDrinker = createServerFn({ method: "POST" })
  .validator(z.object({ destination: z.string().trim().min(5).max(200) }))
  .handler(async ({ data }): Promise<DrinkerPreview> => {
    const empty: DrinkerPreview = {
      found: false,
      mask: "",
      username: null,
      streak: 0,
      totalSats: 0,
      drinks: 0,
      tier: "shrimp",
      jackpotBoostPct: 0,
      legacy: false,
      pour500: false,
      pour1000: false,
    };
    if (!isClaimableLightning(data.destination)) return empty;
    const sql = await getSql();
    await ensureStreakSchema(sql);
    await ensureLegacySchema(sql);
    await ensurePour500Schema(sql);
    await ensurePour1000Schema(sql);
    await ensureUsernameSchema(sql);
    const lightning = await import("@/lib/lightning.server");
    const destNorm = data.destination.trim().toLowerCase();
    const row = (
      await sql<DrinkerRow>`
      select destination_mask, username, total_sats, drink_count, current_streak, last_drink_utc,
             is_legacy, legacy_rank, is_pour_500, is_pour_1000
      from faucet_drinkers
      where destination_hash = ${await lightning.sha256Hex(`dest:${destNorm}`)}
    `
    )[0];
    if (!row) return empty;
    const { freeze } = await loadFreeze(sql);
    const streak = liveStreak(
      Number(row.current_streak),
      row.last_drink_utc,
      new Date(),
      freeze,
    );
    const total = Number(row.total_sats);
    return {
      found: true,
      mask: row.destination_mask,
      username: row.username?.trim() || null,
      streak,
      totalSats: total,
      drinks: Number(row.drink_count),
      tier: animalTier(total),
      jackpotBoostPct: jackpotBoostPct(streak),
      legacy: Boolean(row.is_legacy),
      pour500: Boolean(row.is_pour_500),
      pour1000: Boolean(row.is_pour_1000),
    };
  });

export const createChallenge = createServerFn({ method: "POST" })
  .validator(z.object({}))
  .handler(
    async (): Promise<
      { ok: true; id: string; difficulty: number } | { ok: false; error: string }
    > => {
      const sql = await getSql();
      const { maintenance } = await loadFreeze(sql);
      if (maintenance) {
        return {
          ok: false,
          error:
            "The spring is under maintenance. Streaks are frozen. Come back in a day or two.",
        };
      }
      const lightning = await import("@/lib/lightning.server");
      await lightning.ensureLightningSchema(sql);
      const ip = await clientIp();
      const ipHash = await lightning.sha256Hex(`ip:${ip}`);
      const recent = await sql<{ n: number }>`
      select count(*)::int as n
      from faucet_challenges
      where ip_hash = ${ipHash}
        and created_at > now() - interval '2 minutes'
    `;
      if (Number(recent[0]?.n ?? 0) >= 8) {
        return { ok: false, error: "Slow down a moment, then try again." };
      }
      await sql.query(
        "delete from faucet_challenges where created_at < now() - interval '2 hours'",
      );
      const id = crypto.randomUUID();
      await sql`
      insert into faucet_challenges (id, difficulty, ip_hash)
      values (${id}, ${POW_DIFFICULTY}, ${ipHash})
    `;
      return { ok: true, id, difficulty: POW_DIFFICULTY };
    },
  );

export const claimSats = createServerFn({ method: "POST" })
  .validator(
    z.object({
      destination: z.string().trim().min(5).max(200),
      claimToken: z.string().min(8).max(128),
      challengeId: z.string().uuid(),
      nonce: z.number().int().min(0).max(50_000_000),
      honeypot: z.string().max(200).optional(),
      username: z.string().max(24).optional(),
    }),
  )
  .handler(async ({ data }): Promise<ClaimResult> => {
    if (data.honeypot && data.honeypot.trim().length > 0) {
      return {
        ok: false,
        error: "The spring is recharging. Try again in a moment.",
      };
    }
    if (!isClaimableLightning(data.destination)) {
      if (classifyDestination(data.destination) === "onchain") {
        return {
          ok: false,
          error:
            "Real pours are Lightning only. Use a Lightning address like you@wallet.com.",
        };
      }
      return { ok: false, error: "Paste a Lightning address (name@host)." };
    }
    const wantedName = parseUsername(data.username);
    if (!wantedName.ok) {
      return { ok: false, error: wantedName.error };
    }
    const sql = await getSql();
    const lightning = await import("@/lib/lightning.server");
    await lightning.ensureLightningSchema(sql);
    await ensureStreakSchema(sql);
    await ensureLegacySchema(sql);
    await ensurePour500Schema(sql);
    await ensurePour1000Schema(sql);
    await ensurePourTierSchema(sql);
    await ensureUsernameSchema(sql);
    await ensureDayLockSchema(sql);
    const { maintenance, freeze } = await loadFreeze(sql);
    if (maintenance) {
      return {
        ok: false,
        error:
          "The spring is under maintenance. Streaks are frozen. Come back in a day or two.",
      };
    }
    const wallet = await lightning.loadWallet();
    if (!wallet) {
      return {
        ok: false,
        error: "The spring is sealed. The keeper has not connected Lightning yet.",
      };
    }
    const challenge = (
      await sql<{ id: string; created_at: Date | string; difficulty: number }>`
      update faucet_challenges
      set consumed_at = now()
      where id = ${data.challengeId}
        and consumed_at is null
        and created_at > now() - interval '2 minutes'
      returning id, created_at, difficulty
    `
    )[0];
    if (!challenge) {
      return { ok: false, error: "The puzzle expired. Try the pour again." };
    }
    if (Date.now() - new Date(challenge.created_at).getTime() < 400) {
      return { ok: false, error: "That was too fast. Drink like a human." };
    }
    const difficulty = Number(challenge.difficulty) || POW_DIFFICULTY;
    if (!(await verifyPow(data.challengeId, data.nonce, difficulty))) {
      return { ok: false, error: "The spring puzzle failed. Try again." };
    }
    if (Date.now() - new Date(challenge.created_at).getTime() > POW_TTL_MS) {
      return { ok: false, error: "The puzzle expired. Try the pour again." };
    }
    const destNorm = data.destination.trim().toLowerCase();
    const destHash = await lightning.sha256Hex(`dest:${destNorm}`);
    const ip = await clientIp();
    const ipHash = await lightning.sha256Hex(`ip:${ip}`);
    const tokenHash = await hashToken(data.claimToken);
    const dayStart = utcDayStart();
    const lastToken = await sql<{ created_at: Date | string }>`
      select created_at from faucet_claims
      where claim_token_hash = ${tokenHash}
      order by created_at desc limit 1
    `;
    if (lastToken[0]) {
      const wait = retryMs(lastToken[0].created_at, COOLDOWN_MS);
      if (wait > 0) {
        return {
          ok: false,
          error: "The spring is recharging. Try again in a moment.",
          retryAfterMs: wait,
        };
      }
    }
    const ipToday = (
      await sql<{ n: number }>`
        select count(*)::int as n
        from faucet_claims
        where ip_hash = ${ipHash} and paid = true and created_at >= ${dayStart}
      `
    )[0];
    if (Number(ipToday?.n ?? 0) >= IP_DRINKS_PER_DAY) {
      return {
        ok: false,
        error:
          "This connection already poured enough today. Shared Wi‑Fi gets four drinks a day.",
      };
    }
    const destToday = (
      await sql<{ n: number }>`
        select count(*)::int as n
        from faucet_claims
        where destination_hash = ${destHash} and paid = true and created_at >= ${dayStart}
      `
    )[0];
    if (Number(destToday?.n ?? 0) >= 1) {
      return {
        ok: false,
        error: "That Lightning address already drank today.",
      };
    }
    if (wantedName.name) {
      const taken = (
        await sql<{ destination_hash: string }>`
        select destination_hash from faucet_drinkers
        where username = ${wantedName.name} and destination_hash <> ${destHash}
        limit 1
      `
      )[0];
      if (taken) {
        return { ok: false, error: "That name is taken." };
      }
    }
    const daily = await sql<{ n: number; sats: number }>`
      select count(*)::int as n, coalesce(sum(amount_sats), 0)::int as sats
      from faucet_claims
      where paid = true and created_at >= ${dayStart}
    `;
    if (Number(daily[0]?.n ?? 0) >= MAX_CLAIMS_PER_DAY) {
      return holdStreakForCap(
        sql,
        destHash,
        "The fountain is resting until tomorrow.",
      );
    }
    if (Number(daily[0]?.sats ?? 0) >= MAX_SATS_PER_DAY) {
      return holdStreakForCap(
        sql,
        destHash,
        "Today's spring has run its course. Come back tomorrow.",
      );
    }
    const budget = Number(
      (
        await sql<{ balance_sats: number }>`
        select balance_sats from faucet_pool where id = 1
      `
      )[0]?.balance_sats ?? wallet.budgetSats,
    );
    if (budget < MIN_CLAIM_SATS) {
      return {
        ok: false,
        error: "The spring is dry. Come back when the keeper fills it.",
      };
    }
    let liveWallet = wallet.walletSats;
    try {
      liveWallet = await lightning.probeWallet(wallet.blob);
      await lightning.setWalletSats(liveWallet);
    } catch {
      /* keep cached */
    }
    const payable = Math.min(budget, liveWallet);
    if (payable < MIN_CLAIM_SATS) {
      return {
        ok: false,
        error: "The connected wallet does not have enough sats for a pour.",
      };
    }
    const priorRow = (
      await sql<DrinkerRow>`
      select destination_mask, username, total_sats, drink_count, current_streak, last_drink_utc,
             is_legacy, legacy_rank, is_pour_500, is_pour_1000
      from faucet_drinkers
      where destination_hash = ${destHash}
    `
    )[0];
    const streak = nextStreak(
      Number(priorRow?.current_streak ?? 0),
      priorRow?.last_drink_utc ?? null,
      new Date(),
      freeze,
    );
    const advertisedJackpot = jackpotSatsForPot(payable);
    const rolled = rollPour(payable, streak);
    const amount =
      rolled.tier === "jackpot"
        ? Math.min(payable, advertisedJackpot)
        : rolled.amount;
    const tier = rolled.tier;
    const mask = maskDestination(data.destination, "lightning");
    const drinkUtc = utcDateString();
    const destLocked = await takeDayLock(sql, "dest", destHash, drinkUtc);
    if (!destLocked) {
      return { ok: false, error: "That Lightning address already drank today." };
    }
    const ipLocked = await takeDayLock(
      sql,
      "ip",
      ipHash,
      drinkUtc,
      IP_DRINKS_PER_DAY,
    );
    if (!ipLocked) {
      await releaseDayLock(sql, "dest", destHash, drinkUtc);
      return {
        ok: false,
        error:
          "This connection already poured enough today. Shared Wi‑Fi gets four drinks a day.",
      };
    }
    let bolt11: string;
    try {
      bolt11 = await lightning.lnurlPayInvoice(data.destination, amount);
    } catch (err) {
      await releaseDayLock(sql, "dest", destHash, drinkUtc);
      await releaseDayLock(sql, "ip", ipHash, drinkUtc);
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Could not reach that Lightning address.",
      };
    }
    let paymentHash: string;
    try {
      paymentHash = await lightning.payBolt11(wallet.blob, bolt11);
    } catch (err) {
      await releaseDayLock(sql, "dest", destHash, drinkUtc);
      await releaseDayLock(sql, "ip", ipHash, drinkUtc);
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Lightning payment failed.",
      };
    }
    const updated = await sql<{ balance_sats: number }>`
      update faucet_pool
      set
        balance_sats = greatest(0, balance_sats - ${amount}),
        total_claimed_sats = total_claimed_sats + ${amount},
        claim_count = claim_count + 1,
        wallet_sats = greatest(0, wallet_sats - ${amount})
      where id = 1 and balance_sats >= ${amount}
      returning balance_sats
    `;
    const remaining = Number(
      updated[0]?.balance_sats ?? Math.max(0, budget - amount),
    );
    await sql`
      insert into faucet_claims (
        amount_sats, destination_kind, destination_mask, claim_token_hash,
        destination_hash, ip_hash, payment_hash, paid, pour_tier
      )
      values (
        ${amount}, ${"lightning"}, ${mask}, ${tokenHash},
        ${destHash}, ${ipHash}, ${paymentHash.slice(0, 128)}, ${true}, ${tier}
      )
    `;
    const today = drinkUtc;
    await sql`
      insert into faucet_drinkers (
        destination_hash, destination_mask, total_sats, drink_count,
        current_streak, last_drink_utc
      )
      values (${destHash}, ${mask}, ${amount}, ${1}, ${streak}, ${today})
      on conflict (destination_hash) do update set
        destination_mask = excluded.destination_mask,
        total_sats = faucet_drinkers.total_sats + excluded.total_sats,
        drink_count = faucet_drinkers.drink_count + 1,
        current_streak = excluded.current_streak,
        last_drink_utc = excluded.last_drink_utc,
        updated_at = now()
    `;
    let publicName = priorRow?.username?.trim() || null;
    if (wantedName.name) {
      try {
        await sql`
          update faucet_drinkers
          set username = ${wantedName.name}
          where destination_hash = ${destHash}
        `;
        publicName = wantedName.name;
      } catch {
        /* unique race: pour still paid */
      }
    }
    let legacy = Boolean(priorRow?.is_legacy);
    let legacyRank =
      priorRow?.legacy_rank != null ? Number(priorRow.legacy_rank) : null;
    if (!priorRow) {
      const rank = (
        await sql<{ n: number }>`
        update faucet_pool
        set legacy_awarded = legacy_awarded + 1
        where id = 1 and legacy_awarded < ${LEGACY_LIMIT}
        returning legacy_awarded as n
      `
      )[0]?.n;
      if (rank) {
        await sql`
          update faucet_drinkers
          set is_legacy = true, legacy_rank = ${rank}
          where destination_hash = ${destHash}
        `;
        legacy = true;
        legacyRank = Number(rank);
      }
    }
    await assignPour500(sql);
    await assignPour1000(sql);
    const pour500 = Boolean(
      (
        await sql<{ is_pour_500: boolean }>`
        select is_pour_500 from faucet_drinkers where destination_hash = ${destHash}
      `
      )[0]?.is_pour_500,
    );
    const pour1000 = Boolean(
      (
        await sql<{ is_pour_1000: boolean }>`
        select is_pour_1000 from faucet_drinkers where destination_hash = ${destHash}
      `
      )[0]?.is_pour_1000,
    );
    const totalSats = Number(priorRow?.total_sats ?? 0) + amount;
    const drinks = Number(priorRow?.drink_count ?? 0) + 1;
    return {
      ok: true,
      amount,
      tier,
      mask,
      kind: "lightning",
      balance: remaining,
      paid: true,
      streak,
      jackpotBoostPct: jackpotBoostPct(streak),
      totalSats,
      drinks,
      animalTier: animalTier(totalSats),
      legacy,
      legacyRank,
      pour500,
      pour1000,
      username: publicName,
    };
  });

export const verifyKeeper = createServerFn({ method: "POST" })
  .validator(z.object({ phrase: z.string().min(1).max(80) }))
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true }
      | { ok: false; error: string; retryAfterMs?: number }
    > => {
      try {
        const keeperCheck = await keeperMatches(data.phrase);
        if (keeperCheck.ok) return { ok: true };
        return {
          ok: false,
          error: keeperCheck.error ?? "Not the keeper.",
          retryAfterMs: keeperCheck.retryAfterMs,
        };
      } catch (err) {
        console.error("[keeper]", err);
        return { ok: false, error: "Not the keeper." };
      }
    },
  );

export const rotateKeeper = createServerFn({ method: "POST" })
  .validator(
    z.object({
      keeperPhrase: z.string().min(1).max(80),
      nextPhrase: z.string().min(1).max(80),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true } | { ok: false; error: string }> => {
      const keeperCheck = await keeperMatches(data.keeperPhrase);
      if (!keeperCheck.ok) {
        return { ok: false, error: keeperCheck.error ?? "Not the keeper." };
      }
      if (data.nextPhrase.trim() === data.keeperPhrase.trim()) {
        return { ok: false, error: "Pick a new phrase." };
      }
      if (!isStrongKeeperPhrase(data.nextPhrase)) {
        return {
          ok: false,
          error: "Use at least six ordinary words. Four is not enough.",
        };
      }
      const sql = await getSql();
      const nextHash = await hashKeeper(data.nextPhrase);
      await sql`
        update faucet_pool
        set keeper_hash = ${nextHash}
        where id = 1
      `;
      return { ok: true };
    },
  );

export const setMaintenance = createServerFn({ method: "POST" })
  .validator(
    z.object({
      keeperPhrase: z.string().min(1).max(80),
      on: z.boolean(),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; maintenance: boolean } | { ok: false; error: string }> => {
      const keeperCheck = await keeperMatches(data.keeperPhrase);
      if (!keeperCheck.ok) {
        return { ok: false, error: keeperCheck.error ?? "Not the keeper." };
      }
      const sql = await getSql();
      await ensureMaintenanceSchema(sql);
      const today = utcDateString();
      if (data.on) {
        const row = (
          await sql<{
            streak_freeze_from: string | null;
            streak_freeze_until: string | null;
          }>`
          select streak_freeze_from, streak_freeze_until from faucet_pool where id = 1
        `
        )[0];
        const open = Boolean(row?.streak_freeze_from) && !row?.streak_freeze_until;
        const from = open ? row?.streak_freeze_from : today;
        await sql`
          update faucet_pool
          set
            maintenance = true,
            streak_freeze_from = ${from ?? today},
            streak_freeze_until = null
          where id = 1
        `;
        return { ok: true, maintenance: true };
      }
      const row = (
        await sql<{ streak_freeze_from: string | null }>`
        select streak_freeze_from from faucet_pool where id = 1
      `
      )[0];
      const from = row?.streak_freeze_from ?? today;
      const until = from < today ? utcYesterday() : from;
      await sql`
        update faucet_pool
        set
          maintenance = false,
          streak_freeze_from = ${from},
          streak_freeze_until = ${until}
        where id = 1
      `;
      return { ok: true, maintenance: false };
    },
  );

export const hideBasinDonor = createServerFn({ method: "POST" })
  .validator(
    z.object({
      keeperPhrase: z.string().min(1).max(80),
      mask: z.string().min(3).max(80),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true } | { ok: false; error: string }> => {
      const keeperCheck = await keeperMatches(data.keeperPhrase);
      if (!keeperCheck.ok) {
        return { ok: false, error: keeperCheck.error ?? "Not the keeper." };
      }
      const sql = await getSql();
      await ensureDonorSchema(sql);
      await sql`
        update faucet_donors
        set listed = false
        where destination_mask = ${data.mask}
      `;
      await sql`
        update faucet_deposits
        set listed = false
        where dest_mask = ${data.mask} and is_public = true
      `;
      return { ok: true };
    },
  );

export const getWalletStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      keeperPhrase: z.string().min(1).max(80),
      refresh: z.boolean().optional(),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<WalletStatus | { ok: false; error: string }> => {
      const keeperCheck = await keeperMatches(data.keeperPhrase);
      if (!keeperCheck.ok) {
        return { ok: false, error: keeperCheck.error ?? "Not the keeper." };
      }
      const lightning = await import("@/lib/lightning.server");
      const wallet = await lightning.loadWallet();
      if (!wallet) {
        return {
          ok: true,
          connected: false,
          kind: null,
          walletSats: 0,
          budgetSats: 0,
        };
      }
      let walletSats = wallet.walletSats;
      let budgetSats = wallet.budgetSats;
      if (data.refresh) {
        try {
          walletSats = await lightning.probeWallet(wallet.blob);
          await lightning.setWalletSats(walletSats);
          if (walletSats < budgetSats) {
            await (
              await getSql()
            )`
            update faucet_pool
            set balance_sats = ${walletSats}
            where id = 1 and balance_sats > ${walletSats}
          `;
            budgetSats = Math.min(budgetSats, walletSats);
          }
        } catch (err) {
          return { ok: false, error: publicWalletError(err, "Wallet did not answer.") };
        }
      }
      return {
        ok: true,
        connected: true,
        kind: wallet.kind,
        walletSats,
        budgetSats,
      };
    },
  );

export const connectWallet = createServerFn({ method: "POST" })
  .validator(
    z.object({
      keeperPhrase: z.string().min(1).max(80),
      kind: z.enum(["nwc", "lnbits"]),
      nwcUrl: z.string().max(2000).optional(),
      lnbitsUrl: z.string().max(300).optional(),
      lnbitsKey: z.string().max(200).optional(),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<WalletStatus | { ok: false; error: string }> => {
      const keeperCheck = await keeperMatches(data.keeperPhrase);
      if (!keeperCheck.ok) {
        return { ok: false, error: keeperCheck.error ?? "Not the keeper." };
      }
      const lightning = await import("@/lib/lightning.server");
      try {
        const existing = await lightning.loadWallet();
        const blob =
          data.kind === "nwc"
            ? lightning.buildNwcBlob(data.nwcUrl ?? "")
            : lightning.buildLnbitsBlob(data.lnbitsUrl ?? "", data.lnbitsKey ?? "");
        const walletSats = await lightning.probeWallet(blob);
        await lightning.saveWallet(blob, walletSats, !existing);
        return {
          ok: true,
          connected: true,
          kind: blob.kind,
          walletSats,
          budgetSats: existing ? existing.budgetSats : 0,
        };
      } catch (err) {
        return {
          ok: false,
          error: publicWalletError(err, "Could not connect that wallet."),
        };
      }
    },
  );

export const disconnectWallet = createServerFn({ method: "POST" })
  .validator(z.object({ keeperPhrase: z.string().min(1).max(80) }))
  .handler(
    async ({
      data,
    }): Promise<{ ok: true } | { ok: false; error: string }> => {
      const keeperCheck = await keeperMatches(data.keeperPhrase);
      if (!keeperCheck.ok) {
        return { ok: false, error: keeperCheck.error ?? "Not the keeper." };
      }
      await (await import("@/lib/lightning.server")).clearWallet();
      return { ok: true };
    },
  );

export const createDeposit = createServerFn({ method: "POST" })
  .validator(
    z.object({
      keeperPhrase: z.string().min(1).max(80),
      amountSats: z.number().int().min(MIN_FUND_SATS).max(MAX_FUND_SATS),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; deposit: DepositInvoice } | { ok: false; error: string }
    > => {
      const keeperCheck = await keeperMatches(data.keeperPhrase);
      if (!keeperCheck.ok) {
        return { ok: false, error: keeperCheck.error ?? "Not the keeper." };
      }
      const lightning = await import("@/lib/lightning.server");
      const wallet = await lightning.loadWallet();
      if (!wallet) {
        return { ok: false, error: "Connect a Lightning wallet first." };
      }
      try {
        const invoice = await lightning.makeDepositInvoice(
          wallet.blob,
          data.amountSats,
        );
        const qrDataUrl = await lightning.invoiceQrDataUrl(invoice.bolt11);
        await (
          await getSql()
        )`
          insert into faucet_deposits (checking_id, amount_sats, bolt11)
          values (${invoice.checkingId}, ${data.amountSats}, ${invoice.bolt11})
        `;
        return {
          ok: true,
          deposit: {
            checkingId: invoice.checkingId,
            bolt11: invoice.bolt11,
            qrDataUrl,
            amountSats: data.amountSats,
            paid: false,
          },
        };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Could not create an invoice.",
        };
      }
    },
  );

export const checkDeposit = createServerFn({ method: "POST" })
  .validator(
    z.object({
      keeperPhrase: z.string().min(1).max(80),
      checkingId: z.string().min(8).max(300),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; paid: false }
      | { ok: true; paid: true; amount: number; balance: number }
      | { ok: false; error: string }
    > => {
      const keeperCheck = await keeperMatches(data.keeperPhrase);
      if (!keeperCheck.ok) {
        return { ok: false, error: keeperCheck.error ?? "Not the keeper." };
      }
      const lightning = await import("@/lib/lightning.server");
      const wallet = await lightning.loadWallet();
      if (!wallet) {
        return { ok: false, error: "Connect a Lightning wallet first." };
      }
      const sql = await getSql();
      const row = (
        await sql<{ amount_sats: number; paid: boolean }>`
        select amount_sats, paid from faucet_deposits where checking_id = ${data.checkingId}
      `
      )[0];
      if (!row) return { ok: false, error: "Invoice not found." };
      if (row.paid) {
        return {
          ok: true,
          paid: true,
          amount: Number(row.amount_sats),
          balance: wallet.budgetSats,
        };
      }
      let paid = false;
      let paidAmount = Number(row.amount_sats);
      try {
        const lookup = await lightning.lookupDepositPaid(
          wallet.blob,
          data.checkingId,
        );
        paid = lookup.paid;
        if (lookup.amountSats > 0) paidAmount = lookup.amountSats;
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Could not check the invoice.",
        };
      }
      if (!paid) return { ok: true, paid: false };
      if (
        !(
          await sql`
        update faucet_deposits
        set paid = true, paid_at = now()
        where checking_id = ${data.checkingId} and paid = false
        returning amount_sats
      `
        )[0]
      ) {
        return {
          ok: true,
          paid: true,
          amount: paidAmount,
          balance: wallet.budgetSats,
        };
      }
      const credit = Math.min(paidAmount, MAX_FUND_SATS);
      const updated = await sql<{ balance_sats: number }>`
        update faucet_pool
        set
          balance_sats = least(${MAX_POOL_SATS}, balance_sats + ${credit}),
          total_funded_sats = total_funded_sats + ${credit},
          fund_count = fund_count + 1,
          wallet_sats = wallet_sats + ${credit}
        where id = 1
        returning balance_sats
      `;
      await sql`insert into faucet_funds (amount_sats) values (${credit})`;
      return {
        ok: true,
        paid: true,
        amount: credit,
        balance: Number(updated[0]?.balance_sats ?? wallet.budgetSats + credit),
      };
    },
  );

export const createPublicTip = createServerFn({ method: "POST" })
  .validator(
    z.object({
      amountSats: z.number().int().min(MIN_TIP_SATS).max(MAX_TIP_SATS),
      destination: z.string().trim().min(5).max(200),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; deposit: DepositInvoice }
      | { ok: false; error: string; retryAfterMs?: number }
    > => {
      if (!isClaimableLightning(data.destination)) {
        return {
          ok: false,
          error: "Use a Lightning address like you@wallet.com.",
        };
      }
      const lightning = await import("@/lib/lightning.server");
      await lightning.ensureLightningSchema(await getSql());
      const wallet = await lightning.loadWallet();
      if (!wallet) {
        return { ok: false, error: "The spring is sealed. Tips are closed for now." };
      }
      const sql = await getSql();
      await ensureDonorSchema(sql);
      const { maintenance } = await loadFreeze(sql);
      if (maintenance) {
        return {
          ok: false,
          error:
            "The spring is under maintenance. Streaks are frozen. Come back in a day or two.",
        };
      }
      const destNorm = data.destination.trim().toLowerCase();
      const destHash = await lightning.sha256Hex(`tip-dest:${destNorm}`);
      const destMask = maskDestination(data.destination, "lightning");
      const ip = await clientIp();
      const ipHash = await lightning.sha256Hex(`tip-ip:${ip}`);
      const lastDest = (
        await sql<{ created_at: Date | string }>`
        select created_at from faucet_deposits
        where is_public = true and paid = true and dest_hash = ${destHash}
        order by created_at desc limit 1
      `
      )[0]?.created_at;
      if (lastDest) {
        const elapsed = Date.now() - new Date(lastDest).getTime();
        if (elapsed < TIP_COOLDOWN_MS) {
          return {
            ok: false,
            error: "One fill per Lightning address per day.",
            retryAfterMs: TIP_COOLDOWN_MS - elapsed,
          };
        }
      }
      const lastIp = (
        await sql<{ created_at: Date | string }>`
        select created_at from faucet_deposits
        where is_public = true and paid = true and ip_hash = ${ipHash}
        order by created_at desc limit 1
      `
      )[0]?.created_at;
      if (lastIp) {
        const elapsed = Date.now() - new Date(lastIp).getTime();
        if (elapsed < TIP_COOLDOWN_MS) {
          return {
            ok: false,
            error: "One fill per day from this connection. Thank you.",
            retryAfterMs: TIP_COOLDOWN_MS - elapsed,
          };
        }
      }
      const hourly = await sql<{ n: number }>`
        select count(*)::int as n from faucet_deposits
        where is_public = true and ip_hash = ${ipHash}
          and created_at > now() - interval '1 hour'
      `;
      if (Number(hourly[0]?.n ?? 0) >= 6) {
        return { ok: false, error: "Slow down a moment, then try again." };
      }
      try {
        const invoice = await lightning.makeDepositInvoice(
          wallet.blob,
          data.amountSats,
        );
        const qrDataUrl = await lightning.invoiceQrDataUrl(invoice.bolt11);
        await sql`
          insert into faucet_deposits (checking_id, amount_sats, bolt11, ip_hash, dest_hash, dest_mask, is_public)
          values (${invoice.checkingId}, ${data.amountSats}, ${invoice.bolt11}, ${ipHash}, ${destHash}, ${destMask}, ${true})
        `;
        return {
          ok: true,
          deposit: {
            checkingId: invoice.checkingId,
            bolt11: invoice.bolt11,
            qrDataUrl,
            amountSats: data.amountSats,
            paid: false,
          },
        };
      } catch (err) {
        return {
          ok: false,
          error: publicWalletError(err, "Could not create a tip invoice."),
        };
      }
    },
  );

export const checkPublicTip = createServerFn({ method: "POST" })
  .validator(z.object({ checkingId: z.string().min(8).max(300) }))
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; paid: false }
      | { ok: true; paid: true; amount: number; balance: number }
      | { ok: false; error: string }
    > => {
      const lightning = await import("@/lib/lightning.server");
      const wallet = await lightning.loadWallet();
      if (!wallet) return { ok: false, error: "The spring is sealed." };
      const sql = await getSql();
      await ensureDonorSchema(sql);
      const row = (
        await sql<{
          amount_sats: number;
          paid: boolean;
          is_public: boolean;
          dest_hash: string | null;
          dest_mask: string | null;
        }>`
        select amount_sats, paid, is_public, dest_hash, dest_mask
        from faucet_deposits where checking_id = ${data.checkingId}
      `
      )[0];
      if (!row || !row.is_public) return { ok: false, error: "Invoice not found." };
      if (row.paid) {
        await syncDonorsFromFills(sql);
        return {
          ok: true,
          paid: true,
          amount: Number(row.amount_sats),
          balance: wallet.budgetSats,
        };
      }
      let paid = false;
      let paidAmount = Number(row.amount_sats);
      try {
        const lookup = await lightning.lookupDepositPaid(
          wallet.blob,
          data.checkingId,
        );
        paid = lookup.paid;
        if (lookup.amountSats > 0) paidAmount = lookup.amountSats;
      } catch (err) {
        return {
          ok: false,
          error: publicWalletError(err, "Could not check the invoice."),
        };
      }
      if (!paid) return { ok: true, paid: false };
      const credit = await creditPublicTip(sql, data.checkingId, paidAmount);
      await syncDonorsFromFills(sql);
      if (credit == null) {
        return {
          ok: true,
          paid: true,
          amount: paidAmount,
          balance: wallet.budgetSats,
        };
      }
      const balance = Number(
        (
          await sql<{ balance_sats: number }>`
            select balance_sats from faucet_pool where id = 1
          `
        )[0]?.balance_sats ?? wallet.budgetSats + credit,
      );
      return {
        ok: true,
        paid: true,
        amount: credit,
        balance,
      };
    },
  );

export const commitFromWallet = createServerFn({ method: "POST" })
  .validator(
    z.object({
      keeperPhrase: z.string().min(1).max(80),
      amountSats: z.number().int().min(MIN_FUND_SATS).max(MAX_FUND_SATS),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; amount: number; balance: number } | { ok: false; error: string }
    > => {
      const keeperCheck = await keeperMatches(data.keeperPhrase);
      if (!keeperCheck.ok) {
        return { ok: false, error: keeperCheck.error ?? "Not the keeper." };
      }
      const lightning = await import("@/lib/lightning.server");
      const wallet = await lightning.loadWallet();
      if (!wallet) {
        return { ok: false, error: "Connect a Lightning wallet first." };
      }
      let live: number;
      try {
        live = await lightning.probeWallet(wallet.blob);
        await lightning.setWalletSats(live);
      } catch (err) {
        return { ok: false, error: publicWalletError(err, "Wallet did not answer.") };
      }
      const room = Math.max(0, live - wallet.budgetSats);
      if (room < MIN_FUND_SATS) {
        return {
          ok: false,
          error: "No extra sats in the wallet to commit. Pay a deposit invoice instead.",
        };
      }
      const amount = Math.min(data.amountSats, room, MAX_FUND_SATS);
      if (wallet.budgetSats + amount > MAX_POOL_SATS) {
        return {
          ok: false,
          error: "The spring is at capacity (0.21 BTC). Let it pour first.",
        };
      }
      const sql = await getSql();
      const updated = await sql<{ balance_sats: number }>`
      update faucet_pool
      set
        balance_sats = balance_sats + ${amount},
        total_funded_sats = total_funded_sats + ${amount},
        fund_count = fund_count + 1,
        wallet_sats = ${live}
      where id = 1
      returning balance_sats
    `;
      await sql`insert into faucet_funds (amount_sats) values (${amount})`;
      return {
        ok: true,
        amount,
        balance: Number(updated[0]?.balance_sats ?? wallet.budgetSats + amount),
      };
    },
  );

export const setTipAddress = createServerFn({ method: "POST" })
  .validator(
    z.object({
      keeperPhrase: z.string().min(1).max(80),
      address: z.string().max(200),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; address: string | null } | { ok: false; error: string }
    > => {
      const keeperCheck = await keeperMatches(data.keeperPhrase);
      if (!keeperCheck.ok) {
        return { ok: false, error: keeperCheck.error ?? "Not the keeper." };
      }
      const trimmed = data.address.trim().toLowerCase();
      const address = trimmed.length === 0 ? null : trimmed;
      if (address && !isClaimableLightning(address)) {
        return {
          ok: false,
          error: "Use a Lightning address like you@getalby.com.",
        };
      }
      const sql = await getSql();
      await ensureTipAddressSchema(sql);
      await sql`
        update faucet_pool
        set tip_ln_address = ${address}
        where id = 1
      `;
      return { ok: true, address };
    },
  );

export const getTipQr = createServerFn({ method: "GET" }).handler(
  async (): Promise<
    { ok: true; address: string; qrDataUrl: string } | { ok: false }
  > => {
    const sql = await getSql();
    await ensureTipAddressSchema(sql);
    const rows = await sql<{ tip_ln_address: string | null }>`
      select tip_ln_address from faucet_pool where id = 1
    `;
    const address = rows[0]?.tip_ln_address?.trim() || "";
    if (!address || !isClaimableLightning(address)) return { ok: false };
    const lightning = await import("@/lib/lightning.server");
    const qrDataUrl = await lightning.textQrDataUrl(
      address.includes("@") ? `lightning:${address}` : address,
    );
    return { ok: true, address, qrDataUrl };
  },
);
