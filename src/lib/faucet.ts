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
export const MAX_SATS_PER_DAY = 100_000;
/** Shared NAT / building Wi‑Fi: several drinkers, not a wallet farm. */
export const IP_DRINKS_PER_DAY = 4;
export const CLAIM_TOKEN_KEY = "fountain-claim-token";
export const USERNAME_KEY = "fountain-board-name";
export const KEEPER_SESSION_KEY = "fountain-keeper-phrase";
export const FEEDBACK_EMAIL = "fountainofyouth.feedback@gmail.com";

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
export const JACKPOT_BASE = 0.02;
export const JACKPOT_BOOST_PER_DAY = 0.001;
export const JACKPOT_BOOST_CAP = 0.05;
export const LEGACY_LIMIT = 100;
/** One badge. The address that drinks paid pour number 500. */
export const POUR_500 = 500;
/** One public badge. The address that drinks paid pour number 1,000. */
export const POUR_1000 = 1000;
/** At this pot a common sip is ~250–700 sats and the jackpot is 10,000. */
export const REFERENCE_POT_SATS = 100_000;

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
  legacy: boolean;
  pour500: boolean;
  pour1000: boolean;
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
  totalSats: number;
  drinks: number;
  animalTier: AnimalTier;
  legacy: boolean;
  legacyRank: number | null;
  pour500: boolean;
  pour1000: boolean;
  username: string | null;
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
};

export type DepositInvoice = {
  checkingId: string;
  bolt11: string;
  qrDataUrl: string;
  amountSats: number;
  paid: boolean;
};

export function formatSats(n: number): string {
  return `${Math.max(0, Math.floor(n)).toLocaleString("en-US")} sats`;
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
 * Pour ranges scale with the pot. Odds are applied separately and do not
 * change. Floor is 21 on a near-empty well, then about 0.25% of the pot so
 * a 20k spring does not only drip 21.
 */
export function pourSchedule(potSats: number): PourBand[] {
  const pot = Math.max(0, Math.floor(potSats));
  const cap = Math.max(MIN_CLAIM_SATS, pot);
  const floor = clampInt(pot * 0.0025, MIN_CLAIM_SATS, cap);
  const jackpot = clampInt(pot * 0.1, floor, cap);
  const rareMax = clampInt(
    pot * 0.038,
    floor,
    Math.max(floor, jackpot - 1),
  );
  const rareMin = clampInt(pot * 0.025, floor, rareMax);
  const unMax = clampInt(pot * 0.018, floor, Math.max(floor, rareMin - 1));
  const unMin = clampInt(pot * 0.01, floor, unMax);
  const commonMax = clampInt(
    pot * 0.007,
    floor,
    Math.max(floor, unMin - 1),
  );
  return [
    { tier: "jackpot", weight: 2, min: jackpot, max: jackpot },
    { tier: "rare", weight: 8, min: rareMin, max: rareMax },
    { tier: "uncommon", weight: 22, min: unMin, max: unMax },
    { tier: "common", weight: 68, min: floor, max: commonMax },
  ];
}

export function jackpotSatsForPot(potSats: number): number {
  return pourSchedule(potSats)[0]!.min;
}

export function rollPour(
  maxPayable: number,
  streak: number,
): { amount: number; tier: PourTier } {
  const ceiling = Math.max(MIN_CLAIM_SATS, Math.floor(maxPayable));
  const bands = pourSchedule(ceiling);
  const jackpot = bands[0]!.min;
  const jackpotP = jackpotChance(streak);
  const others = bands.filter((t) => t.tier !== "jackpot");
  const otherWeight = others.reduce((s, t) => s + t.weight, 0);
  const picked =
    Math.random() < jackpotP
      ? bands[0]!
      : (() => {
          let cursor = Math.random() * otherWeight;
          let next = others[others.length - 1]!;
          for (const tier of others) {
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
  const amount = Math.max(MIN_CLAIM_SATS, Math.min(ceiling, rolled));
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

export function jackpotBoostPct(streak: number): number {
  return Math.min(Math.max(0, streak) * 0.1, JACKPOT_BOOST_CAP * 100);
}

export function jackpotChance(streak: number): number {
  return JACKPOT_BASE + jackpotBoostPct(streak) / 100;
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

export type StreakFreeze = {
  from: string | null;
  until: string | null;
};

export function utcShift(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (d ?? 1) + days))
    .toISOString()
    .slice(0, 10);
}

export function dayInFreeze(
  day: string,
  freeze?: StreakFreeze | null,
): boolean {
  if (!freeze?.from) return false;
  const end = freeze.until ?? utcDateString();
  return day >= freeze.from && day <= end;
}

/** Yesterday, skipping UTC days the spring was frozen. */
export function previousActiveDay(
  day: string,
  freeze?: StreakFreeze | null,
): string {
  let d = utcShift(day, -1);
  for (let i = 0; i < 400 && dayInFreeze(d, freeze); i += 1) {
    d = utcShift(d, -1);
  }
  return d;
}

/** A real (non-frozen) UTC day was skipped after the last drink, before today. */
export function missedOpenDay(
  lastDrinkUtc: string,
  now = new Date(),
  freeze?: StreakFreeze | null,
): boolean {
  const today = utcDateString(now);
  if (lastDrinkUtc >= today) return false;
  let d = utcShift(lastDrinkUtc, 1);
  for (let i = 0; i < 400 && d < today; i += 1) {
    if (!dayInFreeze(d, freeze)) return true;
    d = utcShift(d, 1);
  }
  return false;
}

/** Live streak: 0 if a UTC calendar day was missed (freeze days do not count). */
export function liveStreak(
  stored: number,
  lastDrinkUtc: string | null,
  now = new Date(),
  freeze?: StreakFreeze | null,
): number {
  if (!lastDrinkUtc || stored <= 0) return 0;
  const today = utcDateString(now);
  if (lastDrinkUtc === today) return stored;
  if (missedOpenDay(lastDrinkUtc, now, freeze)) return 0;
  return stored;
}

/** Streak after a successful paid drink on this UTC day. */
export function nextStreak(
  stored: number,
  lastDrinkUtc: string | null,
  now = new Date(),
  freeze?: StreakFreeze | null,
): number {
  const today = utcDateString(now);
  if (lastDrinkUtc === today) return Math.max(1, stored);
  if (lastDrinkUtc && !missedOpenDay(lastDrinkUtc, now, freeze)) {
    return Math.max(1, stored) + 1;
  }
  return 1;
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
