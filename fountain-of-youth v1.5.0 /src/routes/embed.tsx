import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LegalPage } from "@/components/legal-page";
import { PotBadge } from "@/components/pot-badge";
import { Button } from "@/components/ui/button";
import { getPublicPot } from "@/lib/faucet-api";
import { useI18n } from "@/lib/i18n";

type EmbedSearch = {
  widget?: true;
};

export const Route = createFileRoute("/embed")({
  validateSearch: (search: Record<string, unknown>): EmbedSearch => {
    const on =
      search.widget === true || search.widget === "1" || search.widget === "true";
    return on ? { widget: true } : {};
  },
  loader: () => getPublicPot(),
  component: EmbedPage,
  head: () => ({
    meta: [{ title: "Embed · Fountain of Youth" }],
  }),
});

const IFRAME_H = 120;

function EmbedPage() {
  const initial = Route.useLoaderData();
  const { widget } = Route.useSearch();
  const { t } = useI18n();
  const [copied, setCopied] = useState<"iframe" | "json" | null>(null);
  const [origin, setOrigin] = useState("");

  const potQuery = useQuery({
    queryKey: ["public-pot"],
    queryFn: () => getPublicPot(),
    initialData: initial,
    refetchInterval: 20_000,
  });
  const pot = potQuery.data ?? initial;

  useEffect(() => {
    setOrigin(window.location.origin);
    if (!widget) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.minHeight;
    const prevBody = body.style.minHeight;
    html.style.minHeight = "0";
    body.style.minHeight = "0";
    html.style.background = "#0c0a08";
    body.style.background = "#0c0a08";
    return () => {
      html.style.minHeight = prevHtml;
      body.style.minHeight = prevBody;
    };
  }, [widget]);

  const home = origin ? `${origin}/` : "/";
  const jsonSrc = origin ? `${origin}/api/pot` : "/api/pot";
  const iframeSnippet = `<iframe src="${origin ? `${origin}/embed?widget=1` : "/embed?widget=1"}" width="280" height="${IFRAME_H}" style="border:0;border-radius:14px;overflow:hidden;background:#0c0a08" title="Fountain of Youth" loading="lazy"></iframe>`;

  async function copy(which: "iframe" | "json", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  }

  if (widget) {
    return (
      <div className="bg-bg p-1">
        <PotBadge pot={pot} href={home} compact />
      </div>
    );
  }

  return (
    <LegalPage kicker={t("embed.kicker")} title={t("nav.embed")} updated="v1.5.0">
      <p>{t("embed.help")}</p>

      <div className="max-w-[280px]">
        <PotBadge pot={pot} href="/" />
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold text-fg">{t("embed.iframe")}</h2>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-muted">
          {iframeSnippet}
        </pre>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={() => copy("iframe", iframeSnippet)}
        >
          {copied === "iframe" ? t("embed.copied") : t("embed.copy")}
        </Button>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-fg">{t("embed.json")}</h2>
        <p className="mt-2">{t("embed.jsonHelp")}</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-muted">
          {`GET ${jsonSrc || "/api/pot"}`}
        </pre>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={() => copy("json", jsonSrc || "/api/pot")}
        >
          {copied === "json" ? t("embed.copied") : t("embed.copy")}
        </Button>
      </section>
    </LegalPage>
  );
}
