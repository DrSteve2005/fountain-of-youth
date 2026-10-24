import { JackOLantern } from "@/components/leaderboard";
import { isHallowSeason, poolFill } from "@/lib/faucet";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type FaucetWellProps = {
  balance: number;
  pouring: boolean;
  onFill?: () => void;
};

const COINS = [
  { delay: "0s", left: "47%", duration: "1.9s", size: 18 },
  { delay: "0.4s", left: "52%", duration: "2.1s", size: 14 },
  { delay: "0.85s", left: "44%", duration: "1.75s", size: 16 },
  { delay: "1.25s", left: "50%", duration: "2s", size: 12 },
];

const LANTERNS = [
  { delay: "0.55s", left: "38%", duration: "2.15s", size: 18 },
  { delay: "1.5s", left: "60%", duration: "1.9s", size: 15 },
];

const BURST = Array.from({ length: 10 }, (_, i) => ({
  delay: `${i * 0.06}s`,
  left: `${42 + (i % 5) * 3.4}%`,
  size: 12 + (i % 4) * 3,
}));

export function FaucetWell({ balance, pouring, onFill }: FaucetWellProps) {
  const { t } = useI18n();
  const fill = poolFill(balance);
  const dry = balance < 21;
  const intense = fill > 0.45;

  return (
    <button
      type="button"
      className="relative mx-auto block w-full max-w-[240px] cursor-pointer select-none sm:max-w-[340px]"
      aria-label={t("well.fillAria")}
      onClick={onFill}
    >
      <div
        className="absolute inset-x-[8%] top-[12%] h-[58%] rounded-full opacity-80"
        style={{
          background: isHallowSeason()
            ? "radial-gradient(ellipse at center, rgb(196 92 74 / 0.16), transparent 62%)"
            : "radial-gradient(ellipse at center, rgb(212 175 55 / 0.18), transparent 68%)",
        }}
        aria-hidden
      />

      <svg
        viewBox="0 0 320 420"
        className="relative z-10 h-auto w-full"
        role="img"
        aria-label="Gold fountain of youth pouring sats"
      >
        <defs>
          <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f3e2a4" />
            <stop offset="28%" stopColor="#e0c35a" />
            <stop offset="52%" stopColor="#c9a227" />
            <stop offset="78%" stopColor="#8a6a12" />
            <stop offset="100%" stopColor="#d4b84a" />
          </linearGradient>
          <linearGradient id="brass-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f6e7b4" />
            <stop offset="18%" stopColor="#e8c547" />
            <stop offset="50%" stopColor="#b8860b" />
            <stop offset="82%" stopColor="#7a5c10" />
            <stop offset="100%" stopColor="#c9a227" />
          </linearGradient>
          <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0d060" />
            <stop offset="45%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8a6a12" />
          </linearGradient>
          <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a241c" />
            <stop offset="100%" stopColor="#12100c" />
          </linearGradient>
          <radialGradient id="well-glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgb(212 175 55 / 0.28)" />
            <stop offset="100%" stopColor="rgb(12 10 8 / 0)" />
          </radialGradient>
          <clipPath id="liquid-clip">
            <ellipse cx="160" cy="352" rx="118" ry="28" />
          </clipPath>
          <clipPath id="mid-liquid-clip">
            <ellipse cx="160" cy="230" rx="62" ry="16" />
          </clipPath>
        </defs>

        <ellipse cx="160" cy="396" rx="120" ry="14" fill="rgb(0 0 0 / 0.45)" />
        <ellipse cx="160" cy="300" rx="140" ry="100" fill="url(#well-glow)" />

        {/* Lower basin */}
        <ellipse
          cx="160"
          cy="358"
          rx="132"
          ry="36"
          fill="url(#stone)"
          stroke="url(#brass)"
          strokeWidth="3"
        />
        <ellipse
          cx="160"
          cy="348"
          rx="118"
          ry="26"
          fill="#0a0907"
          stroke="rgb(212 175 55 / 0.25)"
        />
        {!dry && (
          <g clipPath="url(#liquid-clip)">
            <ellipse
              cx="160"
              cy={366 - 22 * fill}
              rx="110"
              ry={18 + 8 * fill}
              fill="url(#liquid)"
            />
            <ellipse
              className="well-ripple"
              cx="160"
              cy={350 - 10 * fill}
              rx="86"
              ry="7"
              fill="#f6e7b4"
              opacity="0.4"
            />
          </g>
        )}

        {/* Pedestal */}
        <path
          d="M138 300 L148 348 L172 348 L182 300 Z"
          fill="url(#brass-v)"
        />
        <rect x="144" y="268" width="32" height="40" rx="4" fill="url(#brass-v)" />
        <rect x="150" y="274" width="6" height="30" rx="2" fill="rgb(255 255 255 / 0.22)" />

        {/* Mid bowl */}
        <ellipse
          cx="160"
          cy="238"
          rx="74"
          ry="22"
          fill="url(#stone)"
          stroke="url(#brass)"
          strokeWidth="2.5"
        />
        <ellipse cx="160" cy="230" rx="62" ry="14" fill="#0a0907" />
        {!dry && (
          <g clipPath="url(#mid-liquid-clip)">
            <ellipse cx="160" cy="234" rx="56" ry="11" fill="url(#liquid)" />
          </g>
        )}

        <rect x="150" y="168" width="20" height="64" rx="4" fill="url(#brass-v)" />
        <rect x="154" y="174" width="4" height="48" rx="2" fill="rgb(255 255 255 / 0.25)" />

        {/* Upper bowl */}
        <ellipse
          cx="160"
          cy="162"
          rx="42"
          ry="14"
          fill="url(#stone)"
          stroke="url(#brass)"
          strokeWidth="2"
        />
        <ellipse cx="160" cy="157" rx="32" ry="8" fill="#0a0907" />
        {!dry && <ellipse cx="160" cy="157" rx="26" ry="6" fill="url(#liquid)" />}

        {/* Finial */}
        <rect x="154" y="118" width="12" height="40" rx="3" fill="url(#brass-v)" />
        <circle cx="160" cy="112" r="11" fill="url(#brass)" />
        <circle cx="160" cy="108" r="4" fill="#f6e7b4" />

        {/* Water arcs */}
        {!dry && (
          <g
            fill="none"
            stroke="url(#brass)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={pouring ? 0.9 : 0.55}
          >
            <path d="M160 122 C128 150, 108 188, 112 228" />
            <path d="M160 122 C192 150, 212 188, 208 228" />
            <path d="M160 122 C160 170, 160 200, 160 228" />
            <path d="M118 236 C100 280, 90 318, 86 348" />
            <path d="M202 236 C220 280, 230 318, 234 348" />
          </g>
        )}
      </svg>

      <div
        className="pointer-events-none absolute inset-0 z-20 [container-type:size]"
        aria-hidden
      >
        {!dry &&
          COINS.map((coin, i) => (
            <span
              key={i}
              className={cn(
                "drip-coin absolute top-[26%] flex items-center justify-center rounded-full bg-gold font-display font-semibold text-bg",
                intense || pouring ? "drip-coin-fast" : "",
              )}
              style={{
                left: coin.left,
                width: `clamp(10px, ${coin.size * 0.32}cqw, ${coin.size}px)`,
                height: `clamp(10px, ${coin.size * 0.32}cqw, ${coin.size}px)`,
                fontSize: "0.55em",
                animationDelay: coin.delay,
                animationDuration: pouring ? "0.75s" : coin.duration,
                boxShadow: "0 0 10px rgb(212 175 55 / 0.45)",
              }}
            >
              ₿
            </span>
          ))}

        {!dry &&
          isHallowSeason() &&
          LANTERNS.map((lantern, i) => (
            <span
              key={`lantern-${i}`}
              className={cn(
                "drip-coin absolute top-[26%] text-gold",
                intense || pouring ? "drip-coin-fast" : "",
              )}
              style={{
                left: lantern.left,
                width: `clamp(12px, ${lantern.size * 0.36}cqw, ${lantern.size}px)`,
                height: `clamp(12px, ${lantern.size * 0.36}cqw, ${lantern.size}px)`,
                animationDelay: lantern.delay,
                animationDuration: pouring ? "0.75s" : lantern.duration,
              }}
            >
              <JackOLantern className="size-full" />
            </span>
          ))}

        {pouring &&
          BURST.map((coin, i) => (
            <span
              key={`b-${i}`}
              className="absolute top-[24%] flex items-center justify-center rounded-full bg-gold-bright font-display font-semibold text-bg"
              style={{
                left: coin.left,
                width: `clamp(10px, ${coin.size * 0.32}cqw, ${coin.size}px)`,
                height: `clamp(10px, ${coin.size * 0.32}cqw, ${coin.size}px)`,
                fontSize: "0.55em",
                animation: `aureus-pour-burst 0.95s cubic-bezier(0.22, 1, 0.36, 1) ${coin.delay} both`,
                boxShadow: "0 0 12px rgb(240 208 96 / 0.55)",
              }}
            >
              ₿
            </span>
          ))}
      </div>
    </button>
  );
}
