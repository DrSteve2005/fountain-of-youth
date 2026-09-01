import { Zap } from "lucide-react";
import { boardLabel, formatSats, relativeTime, type RecentPour } from "@/lib/faucet";
import { cn } from "@/lib/utils";

export function RecentDrips({ pours, now }: { pours: RecentPour[]; now: number }) {
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
        Recent pours
      </h2>
      <p className="mt-1 text-sm text-muted">The last paid drinks from the fountain.</p>

      {pours.length === 0 ? (
        <p className="mt-6 text-sm text-subtle">No drips yet. Be the first.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {pours.map((pour) => {
            const tier = pour.tier;
            return (
              <li
                key={pour.id}
                className="flex items-center gap-3 py-3 first:pt-1"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    tier === "jackpot"
                      ? "bg-gold text-bg"
                      : "bg-surface-2 text-gold",
                  )}
                >
                  <Zap className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm text-fg",
                      pour.username ? "font-display font-medium" : "font-mono",
                    )}
                  >
                    {boardLabel(pour.username, pour.mask)}
                  </p>
                  <p className="text-xs text-subtle">
                    Lightning
                    {pour.paid ? " · Paid" : ""}
                    {tier === "jackpot" ? " · Jackpot" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-medium tabular-nums text-gold">
                    {formatSats(pour.amount)}
                  </p>
                  <p className="text-xs text-subtle tabular-nums">
                    {relativeTime(pour.createdAt, now)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
