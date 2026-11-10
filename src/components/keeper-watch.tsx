import { formatSats, type KeeperWatch } from "@/lib/faucet";

function clock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(11, 16);
}

export function KeeperWatch({
  watch,
  pending,
}: {
  watch: KeeperWatch | null;
  pending: boolean;
}) {
  const days = watch?.days ?? [];
  const today = watch?.today ?? [];
  const clusters = watch?.clusters ?? [];

  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
          The watch
        </h2>
        <p className="mt-1 text-sm text-muted">
          New names against old ones, and connections that drank from many
          addresses. A tag is the start of a hash, not the line. Drinkers
          never see this.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Pours", watch?.pours],
            ["Addresses", watch?.addresses],
            ["New today", watch?.fresh],
            ["Connections", watch?.connections],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <p className="text-[11px] text-subtle">{label}</p>
            <p className="font-mono text-lg tabular-nums text-gold">
              {pending && value == null ? "…" : (value ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-fg">Fourteen days</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-subtle">
              <tr>
                <th className="py-1 pr-3 font-medium">Day</th>
                <th className="py-1 pr-3 font-medium">Pours</th>
                <th className="py-1 pr-3 font-medium">Addresses</th>
                <th className="py-1 pr-3 font-medium">New</th>
                <th className="py-1 font-medium">Lines</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums text-muted">
              {days.map((day) => (
                <tr key={day.day} className="border-t border-line">
                  <td className="py-1.5 pr-3">{day.day.slice(5)}</td>
                  <td className="py-1.5 pr-3">{day.pours}</td>
                  <td className="py-1.5 pr-3">{day.addresses}</td>
                  <td className="py-1.5 pr-3 text-gold">{day.fresh}</td>
                  <td className="py-1.5">{day.connections}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-fg">Shared connections</p>
        <p className="mt-1 text-xs text-subtle">
          One line, three or more addresses, over the last fourteen days. Two
          drinks in a day is the house limit, not a farm.
        </p>
        {clusters.length === 0 ? (
          <p className="mt-3 text-sm text-subtle">
            {pending ? "Reading the book…" : "No cluster in this window."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {clusters.map((cluster) => (
              <li key={cluster.tag} className="py-2.5">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-sm text-gold">{cluster.tag}</span>
                  <span className="font-mono text-xs tabular-nums text-muted">
                    {cluster.addresses} addresses · {cluster.pours} pours
                  </span>
                </p>
                <p className="mt-1 truncate text-xs text-subtle">
                  {cluster.masks.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-fg">Today</p>
        {today.length === 0 ? (
          <p className="mt-3 text-sm text-subtle">
            {pending ? "Reading the book…" : "No paid drink yet today."}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {today.map((row, index) => (
              <li
                key={`${row.at}-${row.mask}-${index}`}
                className="flex items-center gap-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm text-fg">{row.mask}</p>
                  <p className="text-xs text-subtle">
                    {row.fresh ? "New" : "Old"} · {row.drinks}{" "}
                    {row.drinks === 1 ? "drink" : "drinks"}
                    {row.siblings >= 3
                      ? ` · shared ${row.tag} (${row.siblings})`
                      : row.tag !== "—"
                        ? ` · ${row.tag}`
                        : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm tabular-nums text-gold">
                    {formatSats(row.amount)}
                  </p>
                  <p className="font-mono text-[11px] tabular-nums text-subtle">
                    {clock(row.at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
