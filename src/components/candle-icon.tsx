/**
 * Candle line icon for the Christmas badge. Same 24 px grid, 2 px round
 * stroke and currentColor as the tier icons in leaderboard.tsx, so it takes
 * the same size classes (size-3.5 beside a name, size-4 on the board) and
 * the same text-gold colour.
 */
export function CandleIcon({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      <path d="M12 2c2.5 3 2.5 6 0 7.5-2.5-1.5-2.5-4.5 0-7.5z" />
      <path d="M12 9.5V11" />
      <rect x="8" y="11" width="8" height="9" rx="1" />
      <path d="M6 22h12" />
    </svg>
  );
}
