import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/know")({
  component: KnowPage,
  head: () => ({
    meta: [{ title: "Good to know · Fountain of Youth" }],
  }),
});

function KnowPage() {
  const { t } = useI18n();
  return (
    <LegalPage kicker={t("know.kicker")} title={t("nav.know")} updated={t("know.updated")}>
      <p>{t("know.lead")}</p>

      <LegalSection title={t("know.keys.title")}>
        <p>{t("know.keys.body")}</p>
      </LegalSection>

      <LegalSection title={t("know.exchange.title")}>
        <p>{t("know.exchange.body")}</p>
      </LegalSection>

      <LegalSection title={t("know.hot.title")}>
        <p>{t("know.hot.body")}</p>
      </LegalSection>

      <LegalSection title={t("know.cold.title")}>
        <p>{t("know.cold.body")}</p>
      </LegalSection>

      <LegalSection title={t("know.seed.title")}>
        <p>{t("know.seed.body")}</p>
      </LegalSection>

      <LegalSection title={t("know.lightning.title")}>
        <p>{t("know.lightning.body")}</p>
      </LegalSection>

      <LegalSection title={t("know.address.title")}>
        <p>{t("know.address.body")}</p>
      </LegalSection>

      <LegalSection title={t("know.test.title")}>
        <p>{t("know.test.body")}</p>
      </LegalSection>

      <LegalSection title={t("know.price.title")}>
        <p>{t("know.price.body")}</p>
      </LegalSection>

      <LegalSection title={t("know.tonight.title")}>
        <p>{t("know.tonight.body")}</p>
      </LegalSection>
    </LegalPage>
  );
}
