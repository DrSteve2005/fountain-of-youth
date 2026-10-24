export const MIN_CLAIM_SATS = 21;
export const MAX_POOL_SATS = 21_000_000;
export const MIN_FUND_SATS = 1_000;
export const MAX_FUND_SATS = 2_100_000;
export const MIN_TIP_SATS = 100;
export const MAX_TIP_SATS = 10_000;
export const TIP_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const COOLDOWN_MS = 60_000;
export const IP_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const DEST_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const MAX_CLAIMS_PER_DAY = 500;
/** Shared NAT / building Wi‑Fi: two drinkers a UTC day, not a wallet farm. */
export const IP_DRINKS_PER_DAY = 2;
/** Other paid addresses on one connection, over two weeks, before a new name is turned away. */
export const FARM_ADDRESS_CAP = 2;
/** Share of the day's ordinary budget kept for first drinks. The rest stays for names that already drank. */
export const FRESH_DAY_SHARE = 1 / 3;

export function freshDayBudget(dayBudget: number): number {
  return Math.max(MIN_CLAIM_SATS, Math.floor(dayBudget * FRESH_DAY_SHARE));
}

/** A new name on a busy connection solves a heavier puzzle. A name that already drank does not. */
export function farmPuzzleBits(base: number, siblings: number, fresh: boolean): number {
  if (!fresh || siblings <= 0) return base;
  if (siblings === 1) return base + 1;
  if (siblings === 2) return base + 2;
  return Math.min(base + 3, 22);
}
export const CLAIM_TOKEN_KEY = "fountain-claim-token";
export const USERNAME_KEY = "fountain-board-name";
export const KEEPER_SESSION_KEY = "fountain-keeper-phrase";
export const FEEDBACK_EMAIL = "fountainofyouth.feedback@gmail.com";
export const LANG_KEY = "fountain-lang";
/** One grace day after each 7-day streak milestone. Max one held. */
export const GRACE_EVERY = 7;

/** Six dictionary words. Four is too few once a hash can be guessed offline. */
export function isStrongKeeperPhrase(phrase: string): boolean {
  const words = phrase
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-zA-Z]{3,}/.test(w));
  return words.length >= 6 && phrase.trim().length <= 80;
}

export const FUND_PRESETS = [10_000, 50_000, 100_000, 210_000, 1_000_000] as const;
export const TIP_PRESETS = [100, 500, 1_000, 2_100, 5_000, 10_000] as const;

export const FISH_SATS = 1_000;
export const DOLPHIN_SATS = 5_000;
export const WHALE_SATS = 10_000;
export const STREAM_SATS = 1_000;
export const FLOOD_SATS = 5_000;
/** Expected jackpot sats per pour before a streak. Odds fall as the prize grows. */
export const JACKPOT_EV_SATS = 80;
export const JACKPOT_MIN_CHANCE = 0.002;
export const JACKPOT_MAX_CHANCE = 0.05;
/** A streak multiplies jackpot odds. +1% per day, up to +50% (1.5×). */
export const JACKPOT_STREAK_PER_DAY = 0.01;
export const JACKPOT_STREAK_CAP = 0.5;
/** A UTC day may pay this share of the pot, then the spring rests. */
export const DAILY_POT_SLICE = 0.3;
/** Below this live pot the 30% day does not apply. The well may be emptied. */
export const SMALL_POT_FREE = 1_000;
/** Ordinary (non-jackpot) sips: +1% per streak day, capped at +25%. */
export const PAYOUT_BOOST_PER_DAY = 0.01;
export const PAYOUT_BOOST_CAP = 0.25;
export const LEGACY_LIMIT = 100;
/** One badge. The address that drinks paid pour number 500. */
export const POUR_500 = 500;
/** One public badge. The address that drinks paid pour number 1,000. */
export const POUR_1000 = 1000;
/** Ordinary sip refs are calibrated here. Jackpot is always 10% of the live pot. */
export const REFERENCE_POT_SATS = 100_000;
/** Ordinary sips grow with the square root of the pot, so a fill always fattens the drink. */
const SIP_SQRT_K = 1.15;
/** Ordinary pours stay at most this share of the jackpot, so the jackpot is always the prize. */
const SIP_JACKPOT_SHARE = 0.45;

export type DestinationKind = "lightning" | "onchain";
export type PourTier = "common" | "uncommon" | "rare" | "jackpot";
export type WalletKind = "nwc" | "lnbits";
export type AnimalTier = "shrimp" | "fish" | "dolphin" | "whale";
export type DonorTier = "drop" | "stream" | "flood";

export type FaucetState = {
  balance: number;
  totalFunded: number;
  totalClaimed: number;
  claimCount: number;
  fundCount: number;
  recent: RecentPour[];
  walletConnected: boolean;
  walletKind: WalletKind | null;
  jackpotSats: number;
  boardSats: LeaderEntry[];
  boardStreak: LeaderEntry[];
  boardDonors: DonorEntry[];
  recentFills: RecentFill[];
  tipLnAddress: string | null;
  legacyAwarded: number;
  pour500Awarded: boolean;
  pour1000Awarded: boolean;
  maintenance: boolean;
  hallowOpen: boolean;
};

export type RecentPour = {
  id: number;
  amount: number;
  mask: string;
  kind: DestinationKind;
  createdAt: string;
  paid: boolean;
  tier: PourTier;
  username: string | null;
};

export type LeaderEntry = {
  mask: string;
  username: string | null;
  totalSats: number;
  streak: number;
  drinks: number;
  tier: AnimalTier;
  legacy: boolean;
  legacyRank: number | null;
  pour500: boolean;
  pour1000: boolean;
  graceToken: boolean;
  hallow: boolean;
};

export type DonorEntry = {
  mask: string;
  totalSats: number;
  fills: number;
  tier: DonorTier;
};

export type RecentFill = {
  id: number;
  amount: number;
  mask: string;
  createdAt: string;
};

export type DrinkerPreview = {
  found: boolean;
  mask: string;
  username: string | null;
  streak: number;
  totalSats: number;
  drinks: number;
  tier: AnimalTier;
  jackpotBoostPct: number;
  payoutBoostPct: number;
  legacy: boolean;
  pour500: boolean;
  pour1000: boolean;
  graceToken: boolean;
  hallow: boolean;
  /** Paid October days in a row, still alive. Not the lifetime streak. */
  hallowDays: number;
};

export type ClaimOk = {
  ok: true;
  amount: number;
  tier: PourTier;
  mask: string;
  kind: DestinationKind;
  balance: number;
  paid: true;
  streak: number;
  jackpotBoostPct: number;
  payoutBoostPct: number;
  totalSats: number;
  drinks: number;
  animalTier: AnimalTier;
  legacy: boolean;
  legacyRank: number | null;
  pour500: boolean;
  pour1000: boolean;
  username: string | null;
  graceToken: boolean;
  usedGrace: boolean;
  earnedGrace: boolean;
  hallow: boolean;
  earnedHallow: boolean;
};

export type ClaimFail = {
  ok: false;
  error: string;
  retryAfterMs?: number;
};

export type ClaimResult = ClaimOk | ClaimFail;

export type FundResult =
  | { ok: true; amount: number; balance: number }
  | { ok: false; error: string };

export type WalletStatus = {
  ok: true;
  connected: boolean;
  kind: WalletKind | null;
  walletSats: number;
  budgetSats: number;
  /** Paid ordinary pours since 00:00 UTC, and the 30% cap for this pot. */
  daySpentSats: number;
  dayBudgetSats: number;
  /** True when the live pot is under SMALL_POT_FREE and the 30% day is off. */
  dayCapOff: boolean;
  /** One jackpot per UTC day. Claimed fills the bar; otherwise the prize is still open. */
  dayJackpotClaimed: boolean;
  dayJackpotSats: number;
};

/** Keeper-only. A connection tag is the start of a hash, never the line itself. */
export type WatchDay = {
  day: string;
  pours: number;
  addresses: number;
  connections: number;
  fresh: number;
};

export type WatchPour = {
  mask: string;
  amount: number;
  at: string;
  drinks: number;
  fresh: boolean;
  tag: string;
  siblings: number;
};

export type WatchCluster = {
  tag: string;
  addresses: number;
  pours: number;
  masks: string[];
  lastAt: string;
};

export type KeeperWatch = {
  ok: true;
  pours: number;
  addresses: number;
  connections: number;
  fresh: number;
  days: WatchDay[];
  today: WatchPour[];
  clusters: WatchCluster[];
};

export type DepositInvoice = {
  checkingId: string;
  bolt11: string;
  qrDataUrl: string;
  amountSats: number;
  paid: boolean;
};

export type PublicPot = {
  balance: number;
  jackpotSats: number;
  claimCount: number;
  flowing: boolean;
  sealed: boolean;
  maintenance: boolean;
  updatedAt: string;
};

export type Lang = "en" | "es";

export function formatSats(n: number, locale = "en-US"): string {
  return `${Math.max(0, Math.floor(n)).toLocaleString(locale)} sats`;
}

/** One lore line the fountain speaks when a tip lands. */
export function donorLore(sats: number): string {
  if (sats >= 10_000) return "The well drinks deep. Youth returns to the stone.";
  if (sats >= 5_000) return "A flood of gold. The fountain will not forget you.";
  if (sats >= 2_100) return "You poured youth back into the source.";
  if (sats >= 1_000) return "The basin climbs. Strangers will drink because of you.";
  if (sats >= 500) return "Gold water finds the cracks in the stone.";
  if (sats >= 100) return "A drop of youth. The spring remembers.";
  return "Even a single sat is a vow to the well.";
}

export function formatBtc(sats: number): string {
  const btc = sats / 100_000_000;
  if (btc >= 1) return `${btc.toFixed(4)} BTC`;
  if (btc >= 0.01) return `${btc.toFixed(4)} BTC`;
  if (btc >= 0.0001) return `${btc.toFixed(6)} BTC`;
  return `${btc.toFixed(8)} BTC`;
}

export type PourBand = {
  tier: PourTier;
  weight: number;
  min: number;
  max: number;
};

function clampInt(n: number, lo: number, hi: number): number {
  if (hi < lo) return lo;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/**
 * Jackpot is 10% of the pot. Ordinary sips grow with the square root of the
 * well, so filling always fattens the drink, and stay under half the jackpot.
 * A UTC day only pays DAILY_POT_SLICE of the pot, so the well is not one rush.
 */
export function pourSchedule(potSats: number): PourBand[] {
  const pot = Math.max(0, Math.floor(potSats));
  const cap = Math.max(MIN_CLAIM_SATS, pot);
  const floor = MIN_CLAIM_SATS;
  const jackpot = clampInt(pot * 0.1, floor, cap);
  const underJackpot = Math.max(floor, jackpot - 1);
  const ordinaryTop = clampInt(
    SIP_SQRT_K * Math.sqrt(Math.max(pot, floor)),
    floor,
    Math.min(underJackpot, Math.max(floor, Math.floor(jackpot * SIP_JACKPOT_SHARE))),
  );
  const band = (loFrac: number, hiFrac: number, hi: number) => {
    const max = clampInt(ordinaryTop * hiFrac, floor, hi);
    const min = clampInt(ordinaryTop * loFrac, floor, max);
    return { min, max };
  };
  const rare = band(0.78, 1, ordinaryTop);
  const uncommon = band(0.5, 0.7, Math.max(floor, rare.min - 1));
  const common = band(0.22, 0.42, Math.max(floor, uncommon.min - 1));

  return [
    { tier: "jackpot", weight: 2, min: jackpot, max: jackpot },
    { tier: "rare", weight: 8, min: rare.min, max: rare.max },
    { tier: "uncommon", weight: 22, min: uncommon.min, max: uncommon.max },
    { tier: "common", weight: 68, min: common.min, max: common.max },
  ];
}

export function jackpotSatsForPot(potSats: number): number {
  return pourSchedule(potSats)[0]!.min;
}

export function rollPour(
  maxPayable: number,
  streak: number,
  allowJackpot = true,
  commonOnly = false,
): { amount: number; tier: PourTier } {
  const ceiling = Math.max(MIN_CLAIM_SATS, Math.floor(maxPayable));
  const bands = pourSchedule(ceiling);
  const jackpot = bands[0]!.min;
  const jackpotP = allowJackpot && !commonOnly ? jackpotChance(streak, ceiling) : 0;
  const others = bands.filter((t) => t.tier !== "jackpot");
  const table = commonOnly ? others.filter((t) => t.tier === "common") : others;
  const otherWeight = table.reduce((s, t) => s + t.weight, 0);
  const picked =
    Math.random() < jackpotP
      ? bands[0]!
      : (() => {
          let cursor = Math.random() * otherWeight;
          let next = table[table.length - 1]!;
          for (const tier of table) {
            cursor -= tier.weight;
            if (cursor <= 0) {
              next = tier;
              break;
            }
          }
          return next;
        })();
  if (picked.tier === "jackpot") {
    return { amount: Math.min(ceiling, jackpot), tier: "jackpot" };
  }
  const rolled =
    picked.min === picked.max
      ? picked.min
      : picked.min + Math.floor(Math.random() * (picked.max - picked.min + 1));
  const amount = commonOnly
    ? rolled
    : boostNormalPour(rolled, streak, Math.max(MIN_CLAIM_SATS, jackpot - 1));
  return { amount, tier: picked.tier };
}

export function asPourTier(
  value: string | null | undefined,
  amount: number,
): PourTier {
  if (
    value === "jackpot" ||
    value === "rare" ||
    value === "uncommon" ||
    value === "common"
  ) {
    return value;
  }
  return tierForAmount(amount);
}

export function tierForAmount(
  amount: number,
  potSats = REFERENCE_POT_SATS,
): PourTier {
  const bands = pourSchedule(potSats);
  if (amount >= bands[0]!.min) return "jackpot";
  if (amount >= bands[1]!.min) return "rare";
  if (amount >= bands[2]!.min) return "uncommon";
  return "common";
}

export function tierLabel(tier: PourTier): string {
  switch (tier) {
    case "jackpot":
      return "Jackpot";
    case "rare":
      return "Rare";
    case "uncommon":
      return "Uncommon";
    default:
      return "Common";
  }
}

export function animalTier(totalSats: number): AnimalTier {
  if (totalSats >= WHALE_SATS) return "whale";
  if (totalSats >= DOLPHIN_SATS) return "dolphin";
  if (totalSats >= FISH_SATS) return "fish";
  return "shrimp";
}

export function animalLabel(tier: AnimalTier): string {
  switch (tier) {
    case "whale":
      return "Whale";
    case "dolphin":
      return "Dolphin";
    case "fish":
      return "Fish";
    default:
      return "Shrimp";
  }
}

export function donorTier(totalSats: number): DonorTier {
  if (totalSats >= FLOOD_SATS) return "flood";
  if (totalSats >= STREAM_SATS) return "stream";
  return "drop";
}

export function donorLabel(tier: DonorTier): string {
  switch (tier) {
    case "flood":
      return "Flood";
    case "stream":
      return "Stream";
    default:
      return "Drop";
  }
}

/** Sats the spring may pay out in one UTC day. Fifteen percent of the pot. */
export function dailyPourBudget(potSats: number): number {
  const pot = Math.max(0, Math.floor(potSats));
  return Math.max(MIN_CLAIM_SATS, Math.floor(pot * DAILY_POT_SLICE));
}

/** The 30% day rests only once the live pot reaches SMALL_POT_FREE. */
export function dailyCapApplies(potSats: number): boolean {
  return Math.floor(potSats) >= SMALL_POT_FREE;
}

export function jackpotBoostPct(streak: number): number {
  return Math.min(
    Math.max(0, streak) * (JACKPOT_STREAK_PER_DAY * 100),
    JACKPOT_STREAK_CAP * 100,
  );
}

/** Chance of the 10% prize. Smaller on a fat well so one hit cannot empty it. */
export function jackpotChance(streak: number, potSats = REFERENCE_POT_SATS): number {
  const pot = Math.max(MIN_CLAIM_SATS, Math.floor(potSats));
  const jackpot = Math.max(MIN_CLAIM_SATS, Math.floor(pot * 0.1));
  const raw = JACKPOT_EV_SATS / jackpot;
  const base = Math.min(JACKPOT_MAX_CHANCE, Math.max(JACKPOT_MIN_CHANCE, raw));
  return Math.min(JACKPOT_MAX_CHANCE, base * (1 + jackpotBoostPct(streak) / 100));
}

/** Percent added to a common/uncommon/rare sip. 1 per streak day, cap 25. */
export function payoutBoostPct(streak: number): number {
  return Math.min(
    Math.max(0, streak) * (PAYOUT_BOOST_PER_DAY * 100),
    PAYOUT_BOOST_CAP * 100,
  );
}

export function boostNormalPour(
  amount: number,
  streak: number,
  ceiling: number,
): number {
  const boosted = Math.round(amount * (1 + payoutBoostPct(streak) / 100));
  return Math.max(MIN_CLAIM_SATS, Math.min(ceiling, boosted));
}

export function utcDateString(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Inclusive UTC midnight for “today” filters. Not a rolling 24h window. */
export function utcDayStart(now = new Date()): Date {
  return new Date(`${utcDateString(now)}T00:00:00.000Z`);
}

export function utcYesterday(now = new Date()): string {
  const t = new Date(now.getTime());
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}

export type FreezeRange = {
  from: string;
  until: string | null;
};

export type StreakFreeze = {
  from: string | null;
  until: string | null;
  /** Closed windows from earlier maintenance. Needed if the well closes twice before someone drinks. */
  ranges?: FreezeRange[];
};

export function utcShift(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (d ?? 1) + days))
    .toISOString()
    .slice(0, 10);
}

export function freezeRanges(freeze?: StreakFreeze | null): FreezeRange[] {
  if (!freeze) return [];
  const extra = (freeze.ranges ?? []).filter((r) => Boolean(r?.from));
  if (!freeze.from) return extra;
  const current: FreezeRange = { from: freeze.from, until: freeze.until ?? null };
  const already = extra.some(
    (r) => r.from === current.from && (r.until ?? null) === current.until,
  );
  return already ? extra : [current, ...extra];
}

/** Empty-pot days fold into the same freeze math as maintenance. */
export function withDryFreeze(
  freeze: StreakFreeze | null | undefined,
  dryFrom: string | null,
  dryLog: FreezeRange[] = [],
): StreakFreeze {
  const ranges: FreezeRange[] = [...(freeze?.ranges ?? [])];
  for (const range of dryLog) {
    if (range?.from) ranges.push({ from: range.from, until: range.until ?? null });
  }
  if (dryFrom) ranges.push({ from: dryFrom, until: null });
  return {
    from: freeze?.from ?? null,
    until: freeze?.until ?? null,
    ranges,
  };
}

export function dayInFreeze(
  day: string,
  freeze?: StreakFreeze | null,
  now = new Date(),
): boolean {
  const today = utcDateString(now);
  for (const range of freezeRanges(freeze)) {
    const end = range.until ?? today;
    if (day >= range.from && day <= end) return true;
  }
  return false;
}

/** Yesterday, skipping UTC days the spring was frozen. */
export function previousActiveDay(
  day: string,
  freeze?: StreakFreeze | null,
  now = new Date(),
): string {
  let d = utcShift(day, -1);
  for (let i = 0; i < 400 && dayInFreeze(d, freeze, now); i += 1) {
    d = utcShift(d, -1);
  }
  return d;
}

/** Count of non-frozen UTC days skipped after last drink, before today. */
export function openDaysMissed(
  lastDrinkUtc: string,
  now = new Date(),
  freeze?: StreakFreeze | null,
): number {
  const today = utcDateString(now);
  if (lastDrinkUtc >= today) return 0;
  let n = 0;
  let d = utcShift(lastDrinkUtc, 1);
  for (let i = 0; i < 400 && d < today; i += 1) {
    if (!dayInFreeze(d, freeze, now)) n += 1;
    d = utcShift(d, 1);
  }
  return n;
}

/** A real (non-frozen) UTC day was skipped after the last drink, before today. */
export function missedOpenDay(
  lastDrinkUtc: string,
  now = new Date(),
  freeze?: StreakFreeze | null,
): boolean {
  return openDaysMissed(lastDrinkUtc, now, freeze) > 0;
}

/** The Haunting is the whole of October, UTC. Three paid days in a row that month keep the mark. */
export const HALLOW_STREAK_DAYS = 3;
const HALLOW_PREFIX = "2026-10";

export function isHallowDay(day: string): boolean {
  return day.startsWith(HALLOW_PREFIX);
}

function paidRun(days: string[]): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev = "";
  for (const day of sorted) {
    run = prev && utcShift(prev, 1) === day ? run + 1 : 1;
    prev = day;
    if (run > best) best = run;
  }
  return best;
}

/** Longest run of paid days inside October. September does not count. */
export function hallowPaidRun(days: string[]): number {
  return paidRun(days.filter(isHallowDay));
}

/** The live streak is three or more days and every one of those days is in October. */
export function hallowStreakEarned(streak: number, lastDay: string): boolean {
  if (streak < HALLOW_STREAK_DAYS || !isHallowDay(lastDay)) return false;
  return isHallowDay(utcShift(lastDay, -(streak - 1)));
}

/** October days in a row ending today or yesterday. A broken run is zero. */
export function hallowProgress(days: string[], today: string): number {
  const october = [...new Set(days.filter(isHallowDay))].sort();
  if (october.length === 0) return 0;
  const last = october[october.length - 1] ?? "";
  if (last !== today && utcShift(last, 1) !== today) return 0;
  let run = 1;
  for (let i = october.length - 1; i > 0; i -= 1) {
    if (utcShift(october[i - 1] ?? "", 1) === october[i]) run += 1;
    else break;
  }
  return run;
}

export function isHallowSeason(now = new Date()): boolean {
  return now.getUTCMonth() === 9;
}

/** Whole UTC nights left until 1 November, including a partial night. */
export function hallowNightsLeft(now = new Date()): number {
  const end = Date.UTC(now.getUTCFullYear(), 10, 1);
  return Math.max(0, Math.ceil((end - now.getTime()) / 86_400_000));
}

/** The great filling is 20:00 CET on 31 October 2026. The line leaves at midnight. */
const REFILL_AT = Date.UTC(2026, 9, 31, 19, 0, 0);
const REFILL_END = Date.UTC(2026, 9, 31, 23, 0, 0);

export function refillMoment(now = new Date()): { phase: "wait" | "today" | "gone"; ms: number } {
  const t = now.getTime();
  if (t >= REFILL_END) return { phase: "gone", ms: 0 };
  if (t >= REFILL_AT) return { phase: "today", ms: 0 };
  return { phase: "wait", ms: REFILL_AT - t };
}

export function formatRefillWait(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

/** Live streak: 0 if a UTC calendar day was missed (freeze days do not count). */
export function liveStreak(
  stored: number,
  lastDrinkUtc: string | null,
  now = new Date(),
  freeze?: StreakFreeze | null,
  hasGrace = false,
): number {
  if (!lastDrinkUtc || stored <= 0) return 0;
  const today = utcDateString(now);
  if (lastDrinkUtc === today) return stored;
  const missed = openDaysMissed(lastDrinkUtc, now, freeze);
  if (missed === 0) return stored;
  if (missed === 1 && hasGrace) return stored;
  return 0;
}

/**
 * A dry or resting press can move last_drink_utc forward without a paid pour.
 * That only counts when the streak was still alive that morning. A dead streak
 * stays dead — pressing pour must not bring a 4-day streak back.
 */
export function trustedLastDrink(
  lastDrinkUtc: string | null,
  lastPaidUtc: string | null,
  freeze?: StreakFreeze | null,
  hasGrace = false,
): string | null {
  if (!lastPaidUtc) return lastDrinkUtc;
  if (!lastDrinkUtc || lastDrinkUtc <= lastPaidUtc) return lastPaidUtc;
  const missed = openDaysMissed(
    lastPaidUtc,
    new Date(`${lastDrinkUtc}T12:00:00.000Z`),
    freeze,
  );
  if (missed === 0 || (missed === 1 && hasGrace)) return lastDrinkUtc;
  return lastPaidUtc;
}

/**
 * Oldest last-drink date that can still be on the streak board.
 * Three open days back covers today, yesterday, and one grace miss.
 * Frozen days are skipped, so a dry spell does not hide a live streak.
 */
export function streakBoardSince(
  now = new Date(),
  freeze?: StreakFreeze | null,
): string {
  let day = utcDateString(now);
  let open = 0;
  for (let i = 0; i < 400 && open < 3; i += 1) {
    day = utcShift(day, -1);
    if (!dayInFreeze(day, freeze, now)) open += 1;
  }
  return day;
}

/**
 * Existing 7+ day drinkers get a grace token once, at upgrade.
 * Alive streaks (including one open miss that the new token would save).
 * Dead streaks (two+ open misses) do not.
 */
export function shouldBackfillGrace(
  stored: number,
  lastDrinkUtc: string | null,
  now = new Date(),
  freeze?: StreakFreeze | null,
): boolean {
  if (stored < GRACE_EVERY) return false;
  return liveStreak(stored, lastDrinkUtc, now, freeze, true) >= GRACE_EVERY;
}

/** Streak after a successful paid drink on this UTC day. */
export function nextStreak(
  stored: number,
  lastDrinkUtc: string | null,
  now = new Date(),
  freeze?: StreakFreeze | null,
): number {
  return applyStreakDrink(stored, lastDrinkUtc, false, now, freeze).streak;
}

export type StreakDrink = {
  streak: number;
  graceToken: boolean;
  usedGrace: boolean;
  earnedGrace: boolean;
};

/** Paid drink: maybe spend a grace token, maybe earn the next one at 7/14/21… */
export function applyStreakDrink(
  stored: number,
  lastDrinkUtc: string | null,
  hasGrace: boolean,
  now = new Date(),
  freeze?: StreakFreeze | null,
): StreakDrink {
  const today = utcDateString(now);
  if (lastDrinkUtc === today) {
    return {
      streak: Math.max(1, stored),
      graceToken: hasGrace,
      usedGrace: false,
      earnedGrace: false,
    };
  }
  const missed = lastDrinkUtc ? openDaysMissed(lastDrinkUtc, now, freeze) : 99;
  let streak: number;
  let token = hasGrace;
  let usedGrace = false;
  if (!lastDrinkUtc) {
    streak = 1;
  } else if (missed === 0) {
    streak = Math.max(1, stored) + 1;
  } else if (missed === 1 && token) {
    streak = Math.max(1, stored) + 1;
    token = false;
    usedGrace = true;
  } else {
    streak = 1;
    token = false;
  }
  const earnedGrace = !token && streak > 0 && streak % GRACE_EVERY === 0;
  if (earnedGrace) token = true;
  return { streak, graceToken: token, usedGrace, earnedGrace };
}

export function classifyDestination(raw: string): DestinationKind | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) return "lightning";
  if (/^lnurl1[0-9a-z]+$/i.test(s)) return "lightning";
  if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(s)) return "onchain";
  return null;
}

export function isClaimableLightning(raw: string): boolean {
  const s = raw.trim();
  if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) return true;
  if (/^lnurl1[0-9a-z]+$/i.test(s)) return true;
  return false;
}

export function maskDestination(raw: string, kind: DestinationKind): string {
  const s = raw.trim();
  if (kind === "lightning" && s.includes("@")) {
    const at = s.indexOf("@");
    const user = s.slice(0, at);
    const domain = s.slice(at + 1);
    const keep = user.slice(0, Math.min(2, user.length));
    return `${keep}***@${domain.toLowerCase()}`;
  }
  if (s.length <= 10) return `${s.slice(0, 3)}…`;
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

const USERNAME_RE = /^[a-z][a-z0-9_]{2,15}$/;
const RESERVED_NAMES = new Set([
  "keeper",
  "fountain",
  "youth",
  "admin",
  "official",
  "legacy",
  "spring",
  "satoshi",
]);

/** 3-letter / ambiguous tokens: exact match after stripping underscores. */
const BLOCKED_EXACT = new Set([
  "ass",
  "sex",
  "cum",
  "fag",
  "tit",
  "kkk",
  "anal",
  "porn",
  "nsfw",
  "xxx",
  "rape",
  "coon",
  "spic",
  "kike",
  "gook",
  "paki",
  "jap",
  "hoe",
]);

/** Unambiguous slurs/hate/vulgarity: blocked if they appear anywhere in the name. */
const BLOCKED_PART = [
  "nigger",
  "nigga",
  "nigg",
  "faggot",
  "retard",
  "tranny",
  "whore",
  "slut",
  "fuck",
  "shit",
  "dick",
  "cock",
  "cunt",
  "pussy",
  "penis",
  "vagina",
  "nazi",
  "hitler",
  "pedo",
  "paedo",
  "loli",
  "lolita",
  "chink",
  "beaner",
  "darkie",
  "rapist",
  "dildo",
  "boobs",
  "tits",
  "wetback",
  "raghead",
  "1488",
  "siegheil",
  "whitepower",
  "heilhitler",
];

function foldHandle(raw: string): string {
  return raw
    .toLowerCase()
    .replaceAll("0", "o")
    .replaceAll("1", "i")
    .replaceAll("3", "e")
    .replaceAll("4", "a")
    .replaceAll("5", "s")
    .replaceAll("7", "t")
    .replaceAll("8", "b")
    .replaceAll("_", "");
}

export function nameIsBlocked(raw: string): boolean {
  const lower = raw.toLowerCase().replaceAll("_", "");
  const folded = foldHandle(raw);
  for (const hay of [lower, folded]) {
    if (!hay) continue;
    if (BLOCKED_EXACT.has(hay)) return true;
    if (BLOCKED_PART.some((token) => hay.includes(token))) return true;
  }
  return false;
}

export type UsernameParse =
  | { ok: true; name: string | null }
  | { ok: false; error: string };

export function parseUsername(raw: string | undefined | null): UsernameParse {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return { ok: true, name: null };
  if (!USERNAME_RE.test(s)) {
    return {
      ok: false,
      error: "Name is 3–16 characters, starts with a letter, letters/numbers/_ only.",
    };
  }
  if (RESERVED_NAMES.has(s) || nameIsBlocked(s)) {
    return { ok: false, error: "That name isn't allowed." };
  }
  return { ok: true, name: s };
}

export function boardLabel(username: string | null | undefined, mask: string): string {
  const parsed = parseUsername(username);
  if (!parsed.ok || !parsed.name) return mask;
  return parsed.name;
}

export function getOrCreateClaimToken(): string {
  try {
    const existing = localStorage.getItem(CLAIM_TOKEN_KEY);
    if (existing && existing.length >= 8) return existing;
    const token = crypto.randomUUID();
    localStorage.setItem(CLAIM_TOKEN_KEY, token);
    return token;
  } catch {
    return "anon-session";
  }
}

export function relativeTime(iso: string, now = Date.now()): string {
  if (!now) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const delta = Math.max(0, now - then);
  const sec = Math.floor(delta / 1000);
  if (sec < 20) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function poolFill(balance: number): number {
  const visualCap = 1_000_000;
  return Math.max(0, Math.min(1, balance / visualCap));
}
