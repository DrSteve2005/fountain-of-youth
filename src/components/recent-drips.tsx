import { Zap } from "lucide-react";
import { boardLabel, formatSats, type RecentPour } from "@/lib/faucet";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function ago(iso: string, now: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then) || !now) return "";
  const sec = Math.floor(Math.max(0, now - then) / 1000);
  if (sec < 20) return t("relative.justNow");
  if (sec < 60) return t("relative.s", { n: sec });
  const min = Math.floor(sec / 60);
  if (min < 60) return t("relative.m", { n: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t("relative.h", { n: hr });
  return t("relative.d", { n: Math.floor(hr / 24) });
}

export function RecentDrips({ pours, now }: { pours: RecentPour[]; now: number }) {
  const { t, locale } = useI18n();
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
        {t("recent.title")}
      </h2>
      <p className="mt-1 text-sm text-muted">{t("recent.body")}</p>

      {pours.length === 0 ? (
        <p className="mt-6 text-sm text-subtle">{t("recent.empty")}</p>
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
                    {t("recent.lightning")}
                    {pour.paid ? t("recent.paid") : ""}
                    {tier === "jackpot" ? t("recent.jackpot") : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-medium tabular-nums text-gold">
                    {formatSats(pour.amount, locale)}
                  </p>
                  <p className="text-xs text-subtle tabular-nums">
                    {ago(pour.createdAt, now, t)}
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
