import { Droplets, Waves } from "lucide-react";
import { donorLabel, formatSats, type DonorEntry, type DonorTier } from "@/lib/faucet";
import { cn } from "@/lib/utils";

function FloodIcon({ className }: { className?: string }) {
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
      <path d="M4 18c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <path d="M4 14c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <path d="M12 4c-2.2 3.4-4 6.2-4 8.2a4 4 0 1 0 8 0C16 10.2 14.2 7.4 12 4Z" />
    </svg>
  );
}

function DonorMark({ tier }: { tier: DonorTier }) {
  if (tier === "flood") return <FloodIcon className="size-4" />;
  if (tier === "stream") return <Waves className="size-4" />;
  return <Droplets className="size-4" />;
}

export function Donorboard({
  donors,
  keeper = false,
  onHide,
}: {
  donors: DonorEntry[];
  keeper?: boolean;
  onHide?: (mask: string) => void;
}) {
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
          The basin
        </h2>
        <p className="mt-1 text-sm text-muted">
          Who filled the spring. Listed. No extra drink, no better odds.
        </p>
      </div>

      {donors.length === 0 ? (
        <p className="mt-6 text-sm text-subtle">
          No fills yet. The first paid invoice is listed here.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-line">
          {donors.map((row, index) => (
            <li
              key={`${row.mask}-${index}`}
              className="flex items-center gap-3 py-3 first:pt-1"
            >
              <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-subtle">
                {index + 1}
              </span>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  row.tier === "flood"
                    ? "bg-gold text-bg"
                    : row.tier === "stream"
                      ? "bg-gold/15 text-gold"
                      : "bg-surface-2 text-muted",
                )}
              >
                <DonorMark tier={row.tier} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm text-fg">{row.mask}</p>
                <p className="text-xs text-subtle">
                  {donorLabel(row.tier)}
                  {row.fills ? ` · ${row.fills} fill${row.fills === 1 ? "" : "s"}` : ""}
                </p>
              </div>
              <p className="font-mono text-sm font-medium tabular-nums text-gold">
                {formatSats(row.totalSats)}
              </p>
              {keeper && onHide ? (
                <button
                  type="button"
                  onClick={() => onHide(row.mask)}
                  className="text-[11px] font-medium text-subtle underline-offset-2 hover:text-fg hover:underline"
                >
                  Hide
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <p className="mt-4 text-xs leading-normal text-subtle">
        Drop under 1,000 · Stream 1,000–4,999 · Flood 5,000+. 100% to pours.
      </p>
    </section>
  );
}
