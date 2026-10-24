import { useState } from "react";
import { Fish, Flame, Shrimp, Crown, Medal, Shield } from "lucide-react";
import { Donorboard } from "@/components/donorboard";
import {
  boardLabel,
  formatSats,
  type AnimalTier,
  type DonorEntry,
  type LeaderEntry,
} from "@/lib/faucet";
import { useI18n } from "@/lib/i18n";
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

export function JackOLantern({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      <path
        fill="currentColor"
        d="M12 6.7c0-1.6.7-3.2 1.6-4 .2 1.4-.1 2.8-.4 3.8z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 6.6c-1.5 0-2.6.9-3.2 1.9C7.2 7.8 5.4 8.1 4.6 9.5 3.5 11.4 3.6 14.1 4.7 16.5 6 19.3 8.6 21.1 12 21.6c3.4-.5 6-2.3 7.3-5.1 1.1-2.4 1.2-5.1.1-7-.8-1.4-2.6-1.7-4.2-.9C14.6 7.5 13.5 6.6 12 6.6zM7.4 11.2h3.4l-1.7 2.8zM13.2 11.2h3.4l-1.7 2.8zM8.2 15.2c1.1 1.8 2.2 2.5 3.8 2.5s2.7-.7 3.8-2.5c-1 1.15-2.2 1.6-3.8 1.6s-2.8-.45-3.8-1.6z"
      />
    </svg>
  );
}

export function HallowMark() {
  const { t } = useI18n();
  return (
    <JackOLantern className="size-3.5 shrink-0 text-gold" label={t("hallow.mark")} />
  );
}

export function Marks({
  legacy,
  legacyRank,
  pour500,
  pour1000,
  hallow,
}: {
  legacy?: boolean;
  legacyRank?: number | null;
  pour500?: boolean;
  pour1000?: boolean;
  hallow?: boolean;
}) {
  const { t } = useI18n();
  if (!legacy && !pour500 && !pour1000 && !hallow) return null;
  const legacyLabel = legacyRank
    ? `${t("claim.legacy")} #${legacyRank}`
    : t("claim.legacy");
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-gold">
      {legacy ? (
        <Crown className="size-3.5" aria-label={legacyLabel} title={legacyLabel} />
      ) : null}
      {pour500 ? (
        <Medal className="size-3.5" aria-label={t("mark.medal")} title={t("mark.medal")} />
      ) : null}
      {pour1000 ? (
        <span
          className="font-mono text-[10px] leading-none font-medium tabular-nums"
          aria-label={t("claim.thousand")}
          title={t("claim.thousand")}
        >
          1000
        </span>
      ) : null}
      {hallow ? <HallowMark /> : null}
    </span>
  );
}

export function AnimalBadge({
  tier,
}: {
  tier: AnimalTier;
  compact?: boolean;
}) {
  const { t } = useI18n();
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
      {t(`animal.${tier}`)}
    </span>
  );
}

export function Leaderboard({
  bySats,
  byStreak,
  donors = [],
  maintenance = false,
  keeper = false,
  onHideDonor,
}: {
  bySats: LeaderEntry[];
  byStreak: LeaderEntry[];
  donors?: DonorEntry[];
  maintenance?: boolean;
  keeper?: boolean;
  onHideDonor?: (mask: string) => void;
}) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<"sats" | "streak" | "basin">("sats");
  const rows = tab === "sats" ? bySats : byStreak;

  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
            {tab === "basin" ? t("basin.title") : t("board.title")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {tab === "basin" ? t("basin.body") : t("board.body")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-1 rounded-lg bg-surface-2 p-1">
        {(
          [
            { id: "sats" as const, label: t("board.leaders") },
            { id: "streak" as const, label: t("board.streaks") },
            { id: "basin" as const, label: t("basin.tab") },
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

      {tab === "basin" ? (
        <Donorboard
          bare
          donors={donors}
          keeper={keeper}
          onHide={onHideDonor}
        />
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-subtle">{t("board.empty")}</p>
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
                <p className="flex min-w-0 items-center gap-1.5 text-sm text-fg">
                  <span
                    className={cn(
                      "truncate",
                      row.username ? "font-display font-medium" : "font-mono",
                    )}
                  >
                    {boardLabel(row.username, row.mask)}
                  </span>
                  <Marks
                    legacy={row.legacy}
                    legacyRank={row.legacyRank}
                    pour500={row.pour500}
                    pour1000={row.pour1000}
                    hallow={row.hallow}
                  />
                </p>
                <p className="truncate text-xs text-subtle">
                  {t(`animal.${row.tier}`)}
                  {row.drinks
                    ? ` · ${row.drinks === 1 ? t("board.pourOne") : t("board.pours", { n: row.drinks })}`
                    : ""}
                </p>
              </div>
              <div className="text-right">
                {tab === "sats" ? (
                  <>
                    <p className="font-mono text-sm font-medium tabular-nums text-gold">
                      {formatSats(row.totalSats, locale)}
                    </p>
                    <p className="text-xs text-subtle tabular-nums">
                      {row.streak > 0
                        ? t("board.streakDays", { n: row.streak })
                        : t("board.noStreak")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="inline-flex items-center gap-1 font-mono text-sm font-medium tabular-nums text-gold">
                      <Flame className="size-3.5" aria-hidden />
                      {t("board.streakShort", { n: row.streak })}
                      {row.graceToken ? (
                        <Shield className="size-3.5" aria-hidden />
                      ) : null}
                    </p>
                    <p className="text-xs text-subtle tabular-nums">
                      {formatSats(row.totalSats, locale)}
                    </p>
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {tab === "basin" ? null : (
        <p className="mt-4 text-xs leading-normal text-subtle">
          {maintenance ? t("board.frozen") : t("board.legend")}
        </p>
      )}
    </section>
  );
}
