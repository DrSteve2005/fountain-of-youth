import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MAX_TIP_SATS,
  MIN_TIP_SATS,
  TIP_PRESETS,
  donorLore,
  formatSats,
  isClaimableLightning,
  type DepositInvoice,
} from "@/lib/faucet";
import { cn } from "@/lib/utils";

type FillSheetProps = {
  open: boolean;
  sealed: boolean;
  pending: boolean;
  error: string | null;
  lastCredit: number | null;
  deposit: DepositInvoice | null;
  onCreate: (destination: string, amountSats: number) => void;
  onClose: () => void;
};

export function FillSheet({
  open,
  sealed,
  pending,
  error,
  lastCredit,
  deposit,
  onCreate,
  onClose,
}: FillSheetProps) {
  const [copied, setCopied] = useState(false);
  const [destination, setDestination] = useState("");
  const [selected, setSelected] = useState<number>(1_000);

  useEffect(() => {
    if (open) {
      setCopied(false);
    }
  }, [open]);

  if (!open) return null;

  const destOk = isClaimableLightning(destination);
  const watching = Boolean(deposit && !deposit.paid && !(lastCredit && lastCredit > 0));
  const answered = Boolean(lastCredit && lastCredit > 0) || Boolean(deposit?.paid);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (pending || sealed || !destOk) return;
    onCreate(destination.trim(), selected);
  }

  async function copyInvoice() {
    if (!deposit?.bolt11) return;
    try {
      await navigator.clipboard.writeText(deposit.bolt11);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fill-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-surface p-6 shadow-[var(--shadow-border)] sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium tracking-[0.18em] text-gold uppercase">
          Sustain
        </p>
        <h2
          id="fill-title"
          className="mt-2 font-display text-2xl font-semibold tracking-tight text-fg"
        >
          {answered ? "The spring answers" : "Fill the spring"}
        </h2>

        {answered && lastCredit && lastCredit > 0 ? (
          <div className="mt-4 rounded-lg bg-bg px-4 py-3 shadow-[var(--shadow-border)]">
            <p className="font-display text-base leading-snug font-medium text-gold-bright italic">
              {donorLore(lastCredit)}
            </p>
            <p className="mt-2 text-xs text-muted">
              {formatSats(lastCredit)} returned to the spring. 100% to pours.
            </p>
          </div>
        ) : sealed ? (
          <p className="mt-3 text-sm leading-normal text-muted">
            The spring is closed. Come back when it is flowing.
          </p>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <p className="text-sm leading-normal text-muted">
              Pay a Lightning invoice. Cap {formatSats(MAX_TIP_SATS)}. One
              Lightning address per 24 hours. 100% to pours.
            </p>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
                Your Lightning address
              </span>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="you@wallet.com"
                autoComplete="off"
                spellCheck={false}
                autoFocus
                inputMode="email"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {TIP_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium shadow-[var(--shadow-border)]",
                    selected === n
                      ? "bg-gold text-bg"
                      : "bg-bg text-muted hover:text-fg",
                  )}
                  onClick={() => setSelected(n)}
                >
                  {n.toLocaleString("en-US")}
                </button>
              ))}
            </div>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            {!deposit ? (
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={pending || !destOk}
              >
                {pending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    Creating invoice
                  </>
                ) : (
                  `Invoice ${formatSats(selected)}`
                )}
              </Button>
            ) : null}
            <p className="text-xs text-subtle">
              Address is hashed for the daily cap. Min {formatSats(MIN_TIP_SATS)}.
            </p>
          </form>
        )}

        {deposit && !answered ? (
          <div className="mt-4">
            {deposit.qrDataUrl ? (
              <img
                src={deposit.qrDataUrl}
                alt="Lightning invoice"
                className="mx-auto size-48 rounded-lg bg-fg p-2"
              />
            ) : null}
            <p className="mt-3 text-center text-sm text-gold">
              {formatSats(deposit.amountSats)} invoice
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => void copyInvoice()}
            >
              {copied ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              {copied ? "Copied" : "Copy invoice"}
            </Button>
            {watching ? (
              <p className="mt-3 text-center text-xs text-subtle">
                Watching for payment…
              </p>
            ) : null}
          </div>
        ) : null}

        <Button type="button" variant="ghost" className="mt-4 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
