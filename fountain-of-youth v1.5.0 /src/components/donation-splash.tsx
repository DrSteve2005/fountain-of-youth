import { useEffect, useState } from "react";
import { formatSats, type RecentFill } from "@/lib/faucet";

/**
 * Shows a small pill above the fountain for a few seconds whenever a new
 * public fill lands. `fill` should be the most recently detected NEW fill
 * (or null) — the parent is responsible for diffing against what it has
 * already seen so this component only ever gets told about genuinely new
 * fills, once each.
 */
export function DonationSplash({ fill }: { fill: RecentFill | null }) {
  const [visible, setVisible] = useState<RecentFill | null>(null);

  useEffect(() => {
    if (!fill) return;
    setVisible(fill);
    const id = window.setTimeout(() => setVisible(null), 5200);
    return () => window.clearTimeout(id);
  }, [fill]);

  if (!visible) return null;

  return (
    <div
      key={visible.id}
      className="donation-splash pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-2"
      aria-live="polite"
    >
      <div className="rounded-full bg-surface/95 px-3.5 py-1.5 shadow-[var(--shadow-border)] backdrop-blur-sm">
        <p className="whitespace-nowrap font-mono text-[11px] font-medium text-gold sm:text-xs">
          ⚡ {visible.mask} filled the spring · +{formatSats(visible.amount)}
        </p>
      </div>
    </div>
  );
}
