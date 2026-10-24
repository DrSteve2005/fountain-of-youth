import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LangToggle } from "@/components/lang-toggle";
import { useI18n } from "@/lib/i18n";

export function LegalPage({
  kicker,
  title,
  updated,
  children,
}: {
  kicker: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold font-display text-sm font-semibold text-bg">
            ₿
          </span>
          <span className="truncate font-display text-lg font-semibold tracking-tight text-fg">
            Fountain of Youth
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LangToggle />
          <Link
            to="/"
            className="hidden text-sm text-muted underline-offset-2 hover:text-gold hover:underline sm:inline"
          >
            {t("nav.back")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <p className="text-xs font-medium tracking-[0.22em] text-gold uppercase">
          {kicker}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 font-mono text-xs text-subtle">{updated}</p>
        <div className="legal-copy mt-8 space-y-8 text-sm leading-relaxed text-muted">
          {children}
        </div>
      </main>

      <footer className="mx-auto flex max-w-2xl flex-wrap gap-x-4 gap-y-2 px-4 pb-10 text-xs text-subtle sm:px-6">
        <Link to="/" className="hover:text-gold">
          {t("nav.home")}
        </Link>
        <Link to="/faq" className="hover:text-gold">
          {t("nav.faq")}
        </Link>
        <Link to="/embed" className="hover:text-gold">
          {t("nav.embed")}
        </Link>
        <Link to="/changelog" className="hover:text-gold">
          {t("nav.changelog")}
        </Link>
        <Link to="/feedback" className="hover:text-gold">
          {t("nav.feedback")}
        </Link>
        <Link to="/privacy" className="hover:text-gold">
          {t("nav.privacy")}
        </Link>
        <Link to="/terms" className="hover:text-gold">
          {t("nav.terms")}
        </Link>
        <a
          href="https://github.com/DrSteve2005/fountain-of-youth"
          target="_blank"
          rel="noreferrer"
          className="hover:text-gold"
        >
          {t("nav.github")}
        </a>
      </footer>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-fg">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
