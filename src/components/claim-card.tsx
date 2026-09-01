import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Crown, Flame, LoaderCircle, Medal, Zap } from "lucide-react";
import { AnimalBadge } from "@/components/leaderboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupDrinker } from "@/lib/faucet-api";
import {
  COOLDOWN_MS,
  USERNAME_KEY,
  boardLabel,
  classifyDestination,
  formatSats,
  isClaimableLightning,
  type ClaimOk,
} from "@/lib/faucet";
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
    if (disabled || pending || cooling || dry || sealed || maintenance) return;
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
            Drink
          </h2>
          <p className="mt-1 text-sm leading-normal text-muted">
            A random Lightning pour. Fuller spring, bigger sips. Streaks tilt the odds.
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
          {kind === "onchain" ? "On-chain" : "Lightning"}
        </span>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
            Lightning address
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
              Board name
            </span>
            <span className="text-xs font-normal tracking-normal text-subtle">
              optional
            </span>
          </span>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="shown on the board"
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
          <p className="flex flex-wrap items-center gap-2 text-sm text-gold">
            <Flame className="size-4" aria-hidden />
            <span>
              {drinker.streak > 0
                ? `Day ${drinker.streak} streak · jackpot +${drinker.jackpotBoostPct.toFixed(1)}%`
                : "Streak waiting · drink today to continue"}
            </span>
            <AnimalBadge tier={drinker.tier} compact />
            {drinker.pour1000 ? (
              <span className="inline-flex items-center gap-1 text-gold">
                1000th
              </span>
            ) : null}
            {drinker.legacy ? (
              <span className="inline-flex items-center gap-1 text-gold">
                <Crown className="size-3.5" aria-hidden />
                Legacy
              </span>
            ) : null}
            {drinker.pour500 ? (
              <span className="inline-flex items-center gap-1 text-gold">
                <Medal className="size-3.5" aria-hidden />
              </span>
            ) : null}
          </p>
        ) : claimable && drinker && !drinker.found ? (
          <p className="text-xs text-subtle">
            First drink starts a streak.
          </p>
        ) : (
          <p className="text-xs text-subtle">
            Come back each UTC day. Miss a day and the streak resets.
          </p>
        )}

        {kind === "onchain" && (
          <p className="text-xs text-muted">
            On-chain addresses cannot receive a real pour. Use a Lightning
            address.
          </p>
        )}

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {cooling && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock className="size-4 text-gold" aria-hidden />
            <span className="tabular-nums">Recharge {seconds}s</span>
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
                <LoaderCircle className="size-4 animate-spin text-gold" aria-hidden />
                {powPhase === "challenge"
                  ? "Requesting a puzzle…"
                  : powPhase === "solving"
                    ? "Proving you're not a bot…"
                    : "Sending your pour…"}
              </span>
              {powPhase === "solving" && (
                <button
                  type="button"
                  onClick={onCancelPow}
                  className="text-xs font-medium text-subtle underline-offset-2 hover:text-fg hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>
            <span className="relative block h-1 overflow-hidden rounded-full bg-surface">
              <span
                className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-150 ease-out"
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
            disabled || pending || cooling || dry || sealed || maintenance || !claimable
          }
        >
          {pending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              {powPhase === "solving"
                ? "Solving puzzle"
                : powPhase === "submitting"
                  ? "Paying over Lightning"
                  : "Starting"}
            </>
          ) : maintenance ? (
            "Spring is under maintenance"
          ) : sealed ? (
            "Spring is sealed"
          ) : dry ? (
            "Spring is dry"
          ) : cooling ? (
            `Wait ${seconds}s`
          ) : (
            "Drink a random pour"
          )}
        </Button>
        <p className="text-xs leading-normal text-subtle">
          Drinking briefly uses your device to solve a spam-blocking puzzle
          first (~1–2s of CPU on most phones). Also enforces IP and address
          limits. Sats are paid over Lightning, not promised on a ledger.
        </p>
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
            ? "Jackpot pour"
            : pour.tier === "rare"
              ? "Rare pour"
              : "Paid"}
        </p>
        <h2
          id="pour-title"
          className="mt-2 font-display text-5xl leading-none font-semibold tracking-tight text-gold-bright sm:text-6xl"
        >
          {pour.amount.toLocaleString("en-US")}
          <span className="ml-2 font-sans text-lg font-medium text-muted">
            sats
          </span>
        </h2>
        <p className="mt-4 text-sm leading-normal text-muted">
          Paid over Lightning to{" "}
          <span className={pour.username ? "font-display font-medium text-fg" : "font-mono text-fg"}>
            {who}
          </span>
          .
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-medium text-gold">
            <Flame className="size-3.5" aria-hidden />
            Day {pour.streak} streak
          </span>
          <AnimalBadge tier={pour.animalTier} />
          {pour.pour1000 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 text-xs font-medium text-bg">
              1000th
            </span>
          ) : null}
          {pour.legacy ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 text-xs font-medium text-bg">
              <Crown className="size-3.5" aria-hidden />
              Legacy
              {pour.legacyRank ? ` #${pour.legacyRank}` : ""}
            </span>
          ) : null}
          {pour.pour500 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 text-xs font-medium text-bg">
              <Medal className="size-3.5" aria-hidden />
            </span>
          ) : null}
          <span className="text-xs text-subtle">
            Jackpot +{pour.jackpotBoostPct.toFixed(1)}%
          </span>
        </div>
        <p className="mt-3 text-sm text-subtle">
          {formatSats(pour.totalSats)} claimed · {formatSats(pour.balance)} remain
          in the spring.
        </p>
        {pour.legacy ? (
          <p className="mt-2 text-sm text-gold">
            Among the first to drink. You earned a Legacy badge.
          </p>
        ) : null}
        {pour.pour500 ? (
          <p className="mt-2 text-sm text-gold">
            You found it. That badge stays on the board.
          </p>
        ) : null}
        {pour.pour1000 ? (
          <p className="mt-2 text-sm text-gold">
            You drank the 1,000th pour. That stays on the board.
          </p>
        ) : null}
        <Button className="mt-4 w-full" onClick={onDismiss}>
          Close
        </Button>
      </div>
    </div>
  );
}
