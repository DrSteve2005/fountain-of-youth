import { formatSats, type PublicPot } from "@/lib/faucet";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function PotBadge({
  pot,
  href,
  compact = false,
}: {
  pot: PublicPot;
  href: string;
  compact?: boolean;
}) {
  const { t, locale } = useI18n();
  const status = pot.maintenance
    ? t("status.maintenance")
    : pot.flowing
      ? t("status.flowing")
      : pot.sealed
        ? t("status.sealed")
        : t("status.dry");
  const live = pot.flowing;

  return (
    <a
      href={href}
      target="_top"
      rel="noreferrer"
      className={cn(
        "block rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold font-display text-xs font-semibold text-bg">
            ₿
          </span>
          <span className="truncate font-display text-sm font-semibold tracking-tight text-fg">
            {t("embed.title")}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted">
          <span
            className={cn(
              "live-dot size-1.5 rounded-full",
              live ? "bg-gold" : pot.sealed || pot.maintenance ? "bg-subtle" : "bg-danger",
            )}
          />
          {status}
        </span>
      </div>
      <p className="mt-2 font-mono text-xl font-medium tabular-nums tracking-tight text-gold">
        {formatSats(pot.balance, locale)}
      </p>
      <p className="mt-0.5 text-[11px] text-subtle">
        {t("embed.jackpot", { sats: formatSats(pot.jackpotSats, locale) })}
        {" · "}
        {t("embed.drips", { n: pot.claimCount.toLocaleString(locale) })}
      </p>
    </a>
  );
}
