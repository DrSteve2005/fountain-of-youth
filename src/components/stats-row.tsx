import { formatBtc, formatSats } from "@/lib/faucet";
import { useI18n } from "@/lib/i18n";

type StatsRowProps = {
  balance: number;
  totalClaimed: number;
  claimCount: number;
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-medium tabular-nums text-fg sm:text-xl">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

export function StatsRow({ balance, totalClaimed, claimCount }: StatsRowProps) {
  const { t, locale } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
      <Stat
        label={t("stats.spring")}
        value={formatSats(balance, locale)}
        hint={formatBtc(balance)}
      />
      <Stat
        label={t("stats.poured")}
        value={formatSats(totalClaimed, locale)}
        hint={formatBtc(totalClaimed)}
      />
      <Stat
        label={t("stats.drips")}
        value={claimCount.toLocaleString(locale)}
        hint={t("stats.dripsHint")}
      />
    </div>
  );
}
