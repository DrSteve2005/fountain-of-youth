import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { Button } from "@/components/ui/button";
import { FEEDBACK_EMAIL } from "@/lib/faucet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/feedback")({
  component: FeedbackPage,
  head: () => ({
    meta: [{ title: "Feedback · Fountain of Youth" }],
  }),
});

const TOPICS = [
  { id: "bug", label: "Bug" },
  { id: "idea", label: "Idea" },
  { id: "other", label: "Other" },
] as const;

function FeedbackPage() {
  const [topic, setTopic] = useState<(typeof TOPICS)[number]["id"]>("idea");
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
    <LegalPage kicker="v1.3" title="Feedback" updated="31 August 2026">
      <p>
        Tell the keeper if something broke, if a neighbour got locked out, or
        if you have an idea. This does not create an account. It opens your
        mail app to{" "}
        <a
          href={`mailto:${FEEDBACK_EMAIL}`}
          className="font-mono text-gold underline-offset-2 hover:underline"
        >
          {FEEDBACK_EMAIL}
        </a>
        . Do not send seeds, NWC strings, or the keeper phrase.
      </p>

      <LegalSection title="Write">
        <form onSubmit={submit} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "h-9 rounded-full px-3 text-sm",
                  topic === item.id
                    ? "bg-gold text-bg"
                    : "bg-surface text-muted shadow-[var(--shadow-border)] hover:text-fg",
                )}
                onClick={() => setTopic(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Message
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              maxLength={2000}
              placeholder="What should the keeper know?"
              className={cn(
                "flex min-h-32 w-full rounded-md bg-bg px-3 py-2 text-sm text-fg",
                "shadow-[var(--shadow-border)] outline-none",
                "placeholder:text-subtle",
                "transition-[box-shadow] duration-150 ease-out",
                "focus-visible:shadow-[0_0_0_1px_rgb(212_175_55_/_0.55),0_0_0_4px_rgb(212_175_55_/_0.16)]",
              )}
            />
          </label>
          <Button type="submit">Open mail</Button>
        </form>
      </LegalSection>
    </LegalPage>
  );
}
