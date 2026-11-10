import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/faucet";

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center rounded-full bg-surface p-0.5 shadow-[var(--shadow-border)]",
        className,
      )}
      role="group"
      aria-label={t("legal.lang")}
    >
      {(["en", "es"] as const).map((code: Lang) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={cn(
            "h-9 min-w-9 rounded-full px-2 text-[11px] font-medium tracking-wide uppercase",
            lang === code ? "bg-gold text-bg" : "text-muted hover:text-fg",
          )}
          aria-pressed={lang === code}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
