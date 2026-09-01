import { formatBtc, formatSats } from "@/lib/faucet";

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
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
      <Stat label="In the spring" value={formatSats(balance)} hint={formatBtc(balance)} />
      <Stat
        label="Poured"
        value={formatSats(totalClaimed)}
        hint={formatBtc(totalClaimed)}
      />
      <Stat
        label="Drips"
        value={claimCount.toLocaleString("en-US")}
        hint="Paid Lightning pours"
      />
    </div>
  );
}
