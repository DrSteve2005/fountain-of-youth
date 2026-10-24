import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { isHallowSeason } from "@/lib/faucet";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: [{ title: "FAQ · Fountain of Youth" }],
  }),
});

function FaqPage() {
  const { t } = useI18n();
  return (
    <LegalPage kicker={t("faq.kicker")} title={t("nav.faq")} updated={t("faq.updated")}>
      <LegalSection title={t("faq.maint.title")}>
        <p>{t("faq.maint.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.what.title")}>
        <p>{t("faq.what.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.why.title")}>
        <p>{t("faq.why.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.how.title")}>
        <p>{t("faq.how.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.phoenix.title")}>
        <p>{t("faq.phoenix.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.wallets.title")}>
        <p>{t("faq.wallets.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.howMuch.title")}>
        <p>{t("faq.howMuch.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.streak.title")}>
        <p>{t("faq.streak.body")}</p>
      </LegalSection>

      {isHallowSeason() ? (
        <LegalSection title={t("faq.hallow.title")}>
          <p>{t("faq.hallow.body")}</p>
        </LegalSection>
      ) : null}

      <LegalSection title={t("faq.legacy.title")}>
        <p>{t("faq.legacy.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.animals.title")}>
        <p>{t("faq.animals.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.fill.title")}>
        <p>{t("faq.fill.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.cap.title")}>
        <p>{t("faq.cap.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.sealed.title")}>
        <p>{t("faq.sealed.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.puzzle.title")}>
        <p>{t("faq.puzzle.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.mixer.title")}>
        <p>{t("faq.mixer.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.embed.title")}>
        <p>
          {t("faq.embed.body")}{" "}
          <Link to="/embed" className="text-gold underline-offset-2 hover:underline">
            {t("nav.embed")}
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title={t("faq.lang.title")}>
        <p>{t("faq.lang.body")}</p>
      </LegalSection>

      <LegalSection title={t("faq.feedback.title")}>
        <p>
          {t("faq.feedback.body")}{" "}
          <Link
            to="/feedback"
            className="text-gold underline-offset-2 hover:underline"
          >
            {t("nav.feedback")}
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title={t("faq.data.title")}>
        <p>
          {t("faq.data.body")}{" "}
          <Link
            to="/privacy"
            className="text-gold underline-offset-2 hover:underline"
          >
            {t("nav.privacy")}
          </Link>
          {" · "}
          <Link
            to="/terms"
            className="text-gold underline-offset-2 hover:underline"
          >
            {t("nav.terms")}
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
