import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { Button } from "@/components/ui/button";
import { FEEDBACK_EMAIL } from "@/lib/faucet";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/feedback")({
  component: FeedbackPage,
  head: () => ({
    meta: [{ title: "Feedback · Fountain of Youth" }],
  }),
});

const TOPICS = ["bug", "idea", "other"] as const;

function FeedbackPage() {
  const { t } = useI18n();
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("idea");
  const [body, setBody] = useState("");

  const mailto = useMemo(() => {
    const subject = encodeURIComponent(`Fountain: ${topic}`);
    const text = encodeURIComponent(body.trim());
    return `mailto:${FEEDBACK_EMAIL}?subject=${subject}${text ? `&body=${text}` : ""}`;
  }, [topic, body]);

  function submit(event: FormEvent) {
    event.preventDefault();
    window.location.href = mailto;
  }

  return (
    <LegalPage kicker="v1.5.0" title={t("nav.feedback")} updated="17 October 2026">
      <p>
        {t("feedback.lead")}{" "}
        <a
          href={`mailto:${FEEDBACK_EMAIL}`}
          className="font-mono text-gold underline-offset-2 hover:underline"
        >
          {FEEDBACK_EMAIL}
        </a>
        . {t("feedback.warn")}
      </p>

      <LegalSection title={t("feedback.write")}>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((id) => (
              <button
                key={id}
                type="button"
                className={cn(
                  "h-9 rounded-full px-3 text-sm",
                  topic === id
                    ? "bg-gold text-bg"
                    : "bg-surface text-muted shadow-[var(--shadow-border)] hover:text-fg",
                )}
                onClick={() => setTopic(id)}
              >
                {t(`feedback.${id}`)}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              {t("feedback.message")}
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              maxLength={2000}
              placeholder={t("feedback.placeholder")}
              className={cn(
                "flex min-h-32 w-full rounded-md bg-bg px-3 py-2 text-sm text-fg",
                "shadow-[var(--shadow-border)] outline-none",
                "placeholder:text-subtle",
                "transition-[box-shadow] duration-150 ease-out",
                "focus-visible:shadow-[0_0_0_1px_rgb(212_175_55_/_0.55),0_0_0_4px_rgb(212_175_55_/_0.16)]",
              )}
            />
          </label>
          <Button type="submit">{t("feedback.send")}</Button>
        </form>
      </LegalSection>
    </LegalPage>
  );
}