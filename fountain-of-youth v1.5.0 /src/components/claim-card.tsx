import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Flame, LoaderCircle, Shield, Zap } from "lucide-react";
import { AnimalBadge, JackOLantern, Marks } from "@/components/leaderboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupDrinker } from "@/lib/faucet-api";
import {
  COOLDOWN_MS,
  USERNAME_KEY,
  boardLabel,
  classifyDestination,
  formatSats,
  HALLOW_STREAK_DAYS,
  isClaimableLightning,
  isHallowSeason,
  type ClaimOk,
} from "@/lib/faucet";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ClaimCardProps = {
  disabled: boolean;
  dry: boolean;
  sealed: boolean;
  maintenance: boolean;
  pending: boolean;
  error: string | null;
  cooldownMs: number;
  powPhase: "idle" | "challenge" | "solving" | "submitting";
  powProgress: number;
  onCancelPow: () => void;
  onClaim: (destination: string, honeypot: string, username: string) => void;
};

export function ClaimCard({
  disabled,
  dry,
  sealed,
  maintenance,
  pending,
  error,
  cooldownMs,
  powPhase,
  powProgress,
  onCancelPow,
  onClaim,
}: ClaimCardProps) {
  const { t, errorText } = useI18n();
  const [value, setValue] = useState("");
  const [username, setUsername] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [remaining, setRemaining] = useState(cooldownMs);
  const [lookupKey, setLookupKey] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USERNAME_KEY);
      if (stored) setUsername(stored);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setRemaining(cooldownMs);
  }, [cooldownMs]);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = window.setInterval(() => {
      setRemaining((ms) => Math.max(0, ms - 250));
    }, 250);
    return () => window.clearInterval(id);
  }, [remaining > 0]);

  useEffect(() => {
    if (!isClaimableLightning(value)) {
      setLookupKey("");
      return;
    }
    const id = window.setTimeout(() => setLookupKey(value.trim().toLowerCase()), 400);
    return () => window.clearTimeout(id);
  }, [value]);

  const drinkerQuery = useQuery({
    queryKey: ["drinker", lookupKey],
    queryFn: () => lookupDrinker({ data: { destination: lookupKey } }),
    enabled: lookupKey.length > 0,
    staleTime: 15_000,
    refetchInterval: false,
  });

  const drinker = drinkerQuery.data;

  useEffect(() => {
    if (drinker?.found && drinker.username && !username) {
      setUsername(drinker.username);
    }
  }, [drinker?.username]);

  const cooling = remaining > 0;
  const kind = useMemo(() => classifyDestination(value), [value]);
  const claimable = isClaimableLightning(value);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (disabled || pending || cooling || sealed || maintenance) return;
    try {
      const trimmed = username.trim();
      if (trimmed) localStorage.setItem(USERNAME_KEY, trimmed);
    } catch {
      /* ignore */
    }
    onClaim(value, honeypot, username);
  }

  const seconds = Math.ceil(remaining / 1000);
  const progress = cooling ? 1 - remaining / COOLDOWN_MS : 1;

  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
            {t("claim.title")}
          </h2>
          <p className="mt-1 text-sm leading-normal text-muted">
            {t("claim.body")}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
            claimable
              ? "bg-gold/15 text-gold"
              : kind === "onchain"
                ? "bg-surface-2 text-muted"
                : "bg-surface-2 text-subtle",
          )}
        >
          <Zap className="size-3.5" aria-hidden />
          {kind === "onchain" ? t("claim.onchain") : t("claim.lightning")}
        </span>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
            {t("claim.address")}
          </span>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="you@wallet.example"
            autoComplete="off"
            spellCheck={false}
            inputMode="email"
            aria-invalid={Boolean(error)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-baseline gap-1.5">
            <span className="text-xs font-medium tracking-wide text-muted uppercase">
              {t("claim.boardName")}
            </span>
            <span className="text-xs font-normal tracking-normal text-subtle">
              {t("claim.optional")}
            </span>
          </span>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("claim.boardPlaceholder")}
            autoComplete="nickname"
            spellCheck={false}
            maxLength={16}
          />
        </label>

        <div className="hp-field" aria-hidden="true">
          <label>
            Company website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>

        {claimable && drinker?.found ? (
          <div className="space-y-1.5">
            <p className="flex items-start gap-2 text-sm text-gold">
              <Flame className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {drinker.streak > 0
                  ? t("claim.streak", {
                      n: drinker.streak,
                      sip: drinker.payoutBoostPct.toFixed(0),
                      boost: drinker.jackpotBoostPct.toFixed(1),
                    })
                  : t("claim.streakWaiting")}
              </span>
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <AnimalBadge tier={drinker.tier} compact />
              <Marks
                legacy={drinker.legacy}
                pour500={drinker.pour500}
                pour1000={drinker.pour1000}
                hallow={drinker.hallow}
              />
              {isHallowSeason() &&
              !drinker.hallow &&
              drinker.hallowDays > 0 &&
              drinker.hallowDays < HALLOW_STREAK_DAYS ? (
                <span className="inline-flex items-center gap-1 text-xs text-gold">
                  <JackOLantern className="size-3.5" />
                  {t("hallow.progress", { n: drinker.hallowDays })}
                </span>
              ) : null}
            </p>
            {drinker.graceToken ? (
              <p className="flex items-center gap-1.5 text-xs text-gold">
                <Shield className="size-3.5" aria-hidden />
                {t("claim.graceReady")}
              </p>
            ) : null}
          </div>
        ) : claimable && drinker && !drinker.found ? (
          <p className="text-xs text-subtle">{t("claim.first")}</p>
        ) : (
          <p className="text-xs text-subtle">{t("claim.hint")}</p>
        )}

        {kind === "onchain" && (
          <p className="text-xs text-muted">{t("claim.onchainWarn")}</p>
        )}

        {dry && !sealed && !maintenance ? (
          <p className="text-xs text-gold">{t("claim.dryHold")}</p>
        ) : null}

        {error && (
          <p className="text-sm text-danger" role="alert">
            {errorText(error)}
          </p>
        )}

        {cooling && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock className="size-4 text-gold" aria-hidden />
            <span className="tabular-nums">{t("claim.recharge", { s: seconds })}</span>
            <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span
                className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-150 ease-out"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </span>
          </div>
        )}

        {powPhase !== "idle" && (
          <div className="space-y-2 rounded-lg bg-surface-2 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 text-sm text-muted">
              <span className="flex items-center gap-2">
                <LoaderCircle
                  className={cn(
                    "size-4 animate-spin",
                    isHallowSeason() ? "text-ember" : "text-gold",
                  )}
                  aria-hidden
                />
                {powPhase === "challenge"
                  ? t("claim.powChallenge")
                  : powPhase === "solving"
                    ? t("claim.powSolving")
                    : t("claim.powSending")}
              </span>
              {powPhase === "solving" && (
                <button
                  type="button"
                  onClick={onCancelPow}
                  className="text-xs font-medium text-subtle underline-offset-2 hover:text-fg hover:underline"
                >
                  {t("claim.cancel")}
                </button>
              )}
            </div>
            <span className="relative block h-1 overflow-hidden rounded-full bg-surface">
              <span
                className={cn(
                  "absolute inset-y-0 left-0 transition-[width] duration-150 ease-out",
                  isHallowSeason() ? "bg-ember" : "bg-gold",
                )}
                style={{
                  width: `${Math.round(
                    (powPhase === "solving" ? powProgress : 1) * 100,
                  )}%`,
                }}
              />
            </span>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full font-medium"
          disabled={
            disabled || pending || cooling || sealed || maintenance || !claimable
          }
        >
          {pending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              {powPhase === "solving"
                ? t("claim.solving")
                : powPhase === "submitting"
                  ? t("claim.paying")
                  : t("claim.starting")}
            </>
          ) : maintenance ? (
            t("claim.maintBtn")
          ) : sealed ? (
            t("claim.sealedBtn")
          ) : dry ? (
            t("claim.dryBtn")
          ) : cooling ? (
            t("claim.wait", { s: seconds })
          ) : (
            t("claim.submit")
          )}
        </Button>
        <p className="text-xs leading-normal text-subtle">{t("claim.powFoot")}</p>
      </form>
    </section>
  );
}

export function PourSuccess({
  pour,
  onDismiss,
}: {
  pour: ClaimOk;
  onDismiss: () => void;
}) {
  const { t, locale } = useI18n();
  const who = boardLabel(pour.username, pour.mask);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pour-title"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-md rounded-xl bg-surface p-6 shadow-[var(--shadow-border)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium tracking-[0.18em] text-gold uppercase">
          {pour.tier === "jackpot"
            ? t("pour.jackpot")
            : pour.tier === "rare"
              ? t("pour.rare")
              : t("pour.paid")}
        </p>
        <h2
          id="pour-title"
          className="mt-2 font-display text-5xl leading-none font-semibold tracking-tight text-gold-bright sm:text-6xl"
        >
          {pour.amount.toLocaleString(locale)}
          <span className="ml-2 font-sans text-lg font-medium text-muted">
            sats
          </span>
        </h2>
        <p className="mt-4 text-sm leading-normal text-muted">
          {t("pour.to")}{" "}
          <span className={pour.username ? "font-display font-medium text-fg" : "font-mono text-fg"}>
            {who}
          </span>
          .
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-medium text-gold">
            <Flame className="size-3.5" aria-hidden />
            {t("pour.day", { n: pour.streak })}
          </span>
          <AnimalBadge tier={pour.animalTier} />
          <Marks
            legacy={pour.legacy}
            legacyRank={pour.legacyRank}
            pour500={pour.pour500}
            pour1000={pour.pour1000}
            hallow={pour.hallow}
          />
          {pour.payoutBoostPct > 0 ? (
            <span className="text-xs text-subtle">
              {t("pour.sipBoost", { sip: pour.payoutBoostPct.toFixed(0) })}
            </span>
          ) : null}
          <span className="text-xs text-subtle">
            {t("pour.boost", { boost: pour.jackpotBoostPct.toFixed(1) })}
          </span>
        </div>
        <p className="mt-3 text-sm text-subtle">
          {t("pour.remain", {
            claimed: formatSats(pour.totalSats, locale),
            remain: formatSats(pour.balance, locale),
          })}
        </p>
        {pour.usedGrace ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-gold">
            <Shield className="size-3.5" aria-hidden />
            {t("pour.graceUsed")}
          </p>
        ) : null}
        {pour.earnedGrace ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-gold">
            <Shield className="size-3.5" aria-hidden />
            {t("pour.graceEarned")}
          </p>
        ) : null}
        {pour.legacy ? (
          <p className="mt-2 text-sm text-gold">{t("pour.legacyLine")}</p>
        ) : null}
        {pour.pour500 ? (
          <p className="mt-2 text-sm text-gold">{t("pour.foundIt")}</p>
        ) : null}
        {pour.pour1000 ? (
          <p className="mt-2 text-sm text-gold">{t("pour.thousand")}</p>
        ) : null}
        {pour.earnedHallow ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-gold">
            <JackOLantern className="size-4" />
            {t("pour.hallow")}
          </p>
        ) : null}
        <Button className="mt-4 w-full" onClick={onDismiss}>
          {t("pour.close")}
        </Button>
      </div>
    </div>
  );
}
