import { useState } from "react";
import {
  Compass,
  Crown,
  Fish,
  Flame,
  Footprints,
  Map as MapIcon,
  Medal,
  Shield,
  Shrimp,
  Signpost,
} from "lucide-react";
import { CandleIcon } from "@/components/candle-icon";
import { Donorboard } from "@/components/donorboard";
import {
  boardLabel,
  formatSats,
  guideTier,
  type AnimalTier,
  type DonorEntry,
  type GuideTier,
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
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2.88 11.81 C4.01 11.62 5.04 11.06 5.70 10.12 C6.17 7.96 8.52 6.08 11.34 6.55 C14.35 7.21 17.26 10.68 18.49 15.57" />
      <path d="M2.88 11.81 C3.45 12.94 4.39 13.50 5.70 13.69 C8.52 14.16 12.28 13.79 14.54 14.35 C16.23 14.73 17.45 15.10 18.49 15.57" />
      <path d="M21.12 13.32 C19.80 13.88 18.86 14.63 18.49 15.57 C18.11 16.70 17.55 18.20 16.61 19.33" />
      <path d="M11.72 6.64 C12.66 5.42 13.79 4.86 15.29 4.67" />
      <path d="M9.84 14.07 C10.03 15.10 10.59 15.95 11.34 16.51" />
      <path d="M7.58 10.78v.2" />
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

export function XmasMark() {
  const { t } = useI18n();
  return (
    <CandleIcon className="size-3.5 shrink-0 text-gold" label={t("xmas.mark")} />
  );
}

export function HallowMark() {
  const { t } = useI18n();
  return (
    <JackOLantern className="size-3.5 shrink-0 text-gold" label={t("hallow.mark")} />
  );
}

const GUIDE_ICONS: Record<GuideTier, typeof Compass> = {
  scout: Footprints,
  guide: Signpost,
  pathfinder: Compass,
  cartographer: MapIcon,
};

export function GuideIcon({
  tier,
  className,
}: {
  tier: GuideTier;
  className?: string;
}) {
  const Icon = GUIDE_ICONS[tier];
  return <Icon className={cn("size-3.5", className)} aria-hidden />;
}

/** Guide badge: one icon per level, the count in the label. */
export function GuideMark({ referrals }: { referrals: number }) {
  const { t } = useI18n();
  const tier = guideTier(referrals);
  if (!tier) return null;
  const label = t(referrals === 1 ? "guide.markLabelOne" : "guide.markLabel", {
    tier: t(`guide.${tier}`),
    n: referrals,
  });
  return (
    <span
      className="inline-flex shrink-0 items-center text-gold"
      role="img"
      aria-label={label}
      title={label}
    >
      <GuideIcon tier={tier} />
    </span>
  );
}

export function Marks({
  legacy,
  legacyRank,
  pour500,
  pour1000,
  hallow,
  xmas,
  referrals = 0,
}: {
  legacy?: boolean;
  legacyRank?: number | null;
  pour500?: boolean;
  pour1000?: boolean;
  hallow?: boolean;
  xmas?: boolean;
  referrals?: number;
}) {
  const { t } = useI18n();
  const guide = guideTier(referrals) !== null;
  if (!legacy && !pour500 && !pour1000 && !hallow && !xmas && !guide) return null;
  const legacyLabel = legacyRank
    ? `${t("claim.legacy")} #${legacyRank}`
    : t("claim.legacy");
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-gold">
      {legacy ? (
        <Crown className="size-3.5" aria-label={legacyLabel} />
      ) : null}
      {pour500 ? (
        <Medal className="size-3.5" aria-label={t("mark.medal")} />
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
      {xmas ? <XmasMark /> : null}
      {guide ? <GuideMark referrals={referrals} /> : null}
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
  byGuides = [],
  donors = [],
  maintenance = false,
  keeper = false,
  onHideDonor,
}: {
  bySats: LeaderEntry[];
  byStreak: LeaderEntry[];
  byGuides?: LeaderEntry[];
  donors?: DonorEntry[];
  maintenance?: boolean;
  keeper?: boolean;
  onHideDonor?: (mask: string) => void;
}) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<"sats" | "streak" | "guides" | "basin">("sats");
  const rows = tab === "sats" ? bySats : tab === "guides" ? byGuides : byStreak;

  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
            {tab === "basin"
              ? t("basin.title")
              : tab === "guides"
                ? t("guides.title")
                : t("board.title")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {tab === "basin"
              ? t("basin.body")
              : tab === "guides"
                ? t("guides.body")
                : t("board.body")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-1 rounded-lg bg-surface-2 p-1">
        {(
          [
            { id: "sats" as const, label: t("board.leaders") },
            { id: "streak" as const, label: t("board.streaks") },
            { id: "guides" as const, label: t("board.guides") },
            { id: "basin" as const, label: t("basin.tab") },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "h-9 min-w-0 flex-1 truncate rounded-md px-1 text-xs font-medium transition-colors sm:text-sm",
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
        <p className="mt-6 text-sm text-subtle">
          {tab === "guides" ? t("guides.empty") : t("board.empty")}
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
                  tab === "guides"
                    ? "bg-gold/15 text-gold"
                    : row.tier === "whale"
                      ? "bg-gold text-bg"
                      : row.tier === "dolphin" || row.tier === "fish"
                        ? "bg-gold/15 text-gold"
                        : "bg-surface-2 text-muted",
                )}
              >
                {tab === "guides" && guideTier(row.referrals) ? (
                  <GuideIcon tier={guideTier(row.referrals)!} className="size-4" />
                ) : (
                  <AnimalMark tier={row.tier} />
                )}
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
                    xmas={row.xmas}
                    referrals={tab === "guides" ? 0 : row.referrals}
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
                {tab === "guides" ? (
                  <>
                    <p className="font-mono text-sm font-medium tabular-nums text-gold">
                      {row.referrals === 1
                        ? t("guides.countOne")
                        : t("guides.count", { n: row.referrals })}
                    </p>
                    <p className="text-xs text-subtle">
                      {t(`guide.${guideTier(row.referrals) ?? "scout"}`)}
                    </p>
                  </>
                ) : tab === "sats" ? (
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
          {tab === "guides"
            ? t("guides.legend")
            : maintenance
              ? t("board.frozen")
              : t("board.legend")}
        </p>
      )}
    </section>
  );
}
