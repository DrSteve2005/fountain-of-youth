import { useState } from "react";
import { Fish, Flame, Shrimp, Crown, Medal } from "lucide-react";
import {
  animalLabel,
  boardLabel,
  formatSats,
  type AnimalTier,
  type LeaderEntry,
} from "@/lib/faucet";
import { cn } from "@/lib/utils";

function WhaleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 16c1.5-5 6-8 11-7 3 .5 5 2.5 6 5H8" />
      <path d="M8 14c-2 0-4 1.2-5 3" />
      <path d="M16 11.5V9" />
      <path d="M19 14h2l-1.2 2.2A2 2 0 0 1 18 17h-1" />
      <circle cx="9" cy="12.2" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DolphinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 14c2-5 7-8 12-6 2 .8 3.5 2.4 4 4.5H9" />
      <path d="M16 10c.4-2 1.2-3.5 3-4" />
      <path d="M8 16c-1.5.8-3 2.2-3.5 4" />
      <path d="M18 14.5 20 17" />
      <circle cx="10" cy="11.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AnimalMark({
  tier,
  className,
}: {
  tier: AnimalTier;
  className?: string;
}) {
  const iconClass = cn("size-4", className);
  if (tier === "whale") return <WhaleIcon className={iconClass} />;
  if (tier === "dolphin") return <DolphinIcon className={iconClass} />;
  if (tier === "fish") return <Fish className={iconClass} />;
  return <Shrimp className={iconClass} />;
}

export function AnimalBadge({
  tier,
  compact,
}: {
  tier: AnimalTier;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        tier === "whale"
          ? "bg-gold text-bg"
          : tier === "dolphin" || tier === "fish"
            ? "bg-gold/15 text-gold"
            : "bg-surface-2 text-muted",
      )}
    >
      <AnimalMark tier={tier} className="size-3.5" />
      {compact ? animalLabel(tier) : animalLabel(tier)}
    </span>
  );
}

export function Leaderboard({
  bySats,
  byStreak,
  maintenance = false,
}: {
  bySats: LeaderEntry[];
  byStreak: LeaderEntry[];
  maintenance?: boolean;
}) {
  const [tab, setTab] = useState<"sats" | "streak">("sats");
  const rows = tab === "sats" ? bySats : byStreak;

  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
            The spring
          </h2>
          <p className="mt-1 text-sm text-muted">
            Paid drinks only.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-1 rounded-lg bg-surface-2 p-1">
        {(
          [
            { id: "sats" as const, label: "Leaderboard" },
            { id: "streak" as const, label: "Streaks" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "h-9 flex-1 rounded-md text-sm font-medium transition-colors",
              tab === item.id
                ? "bg-gold text-bg"
                : "text-muted hover:text-fg",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-subtle">
          No paid drinkers yet. First pour starts a streak.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-line">
          {rows.map((row, index) => (
            <li key={`${tab}-${row.mask}-${row.username ?? ""}-${index}`} className="flex items-center gap-3 py-3 first:pt-1">
              <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-subtle">
                {index + 1}
              </span>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  row.tier === "whale"
                    ? "bg-gold text-bg"
                    : row.tier === "dolphin" || row.tier === "fish"
                      ? "bg-gold/15 text-gold"
                      : "bg-surface-2 text-muted",
                )}
              >
                <AnimalMark tier={row.tier} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm text-fg">
                  {row.legacy ? (
                    <Crown className="size-3.5 shrink-0 text-gold" aria-hidden />
                  ) : null}
                  {row.pour500 ? (
                    <Medal className="size-3.5 shrink-0 text-gold" aria-hidden />
                  ) : null}
                  {row.pour1000 ? (
                    <Medal className="size-3.5 shrink-0 text-gold" aria-hidden />
                  ) : null}
                  <span
                    className={cn(
                      "truncate",
                      row.username ? "font-display font-medium" : "font-mono",
                    )}
                  >
                    {boardLabel(row.username, row.mask)}
                  </span>
                </p>
                <p className="text-xs text-subtle">
                  {animalLabel(row.tier)}
                  {row.pour1000 ? " · 1000th" : ""}
                  {row.legacy ? " · Legacy" : ""}
                  {row.drinks
                    ? ` · ${row.drinks} pour${row.drinks === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>
              <div className="text-right">
                {tab === "sats" ? (
                  <>
                    <p className="font-mono text-sm font-medium tabular-nums text-gold">
                      {formatSats(row.totalSats)}
                    </p>
                    <p className="text-xs text-subtle tabular-nums">
                      {row.streak > 0 ? `${row.streak}d streak` : "no streak"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="inline-flex items-center gap-1 font-mono text-sm font-medium tabular-nums text-gold">
                      <Flame className="size-3.5" aria-hidden />
                      {row.streak}d
                    </p>
                    <p className="text-xs text-subtle tabular-nums">
                      {formatSats(row.totalSats)}
                    </p>
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-4 text-xs leading-normal text-subtle">
        {maintenance
          ? "Streaks are frozen while the spring is under maintenance. "
          : ""}
        Shrimp under 1,000 · Fish 1,000–4,999 · Dolphin 5,000–9,999 · Whale
        10,000+.
      </p>
    </section>
  );
}
