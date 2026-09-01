import { useState, type FormEvent } from "react";
import { Check, Copy, LoaderCircle, Plus, Unplug, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FUND_PRESETS,
  MAX_FUND_SATS,
  MIN_FUND_SATS,
  formatSats,
  type DepositInvoice,
  type WalletKind,
} from "@/lib/faucet";
import { cn } from "@/lib/utils";

type FundCardProps = {
  walletConnected: boolean;
  walletKind: WalletKind | null;
  walletSats: number;
  budgetSats: number;
  pendingConnect: boolean;
  pendingInvoice: boolean;
  pendingCommit: boolean;
  pendingDisconnect: boolean;
  error: string | null;
  deposit: DepositInvoice | null;
  onConnectNwc: (url: string) => void;
  onConnectLnbits: (url: string, key: string) => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  onCreateInvoice: (amountSats: number) => void;
  onCommit: (amountSats: number) => void;
  maintenance: boolean;
  pendingMaintenance: boolean;
  onSetMaintenance: (on: boolean) => void;
  pendingRotate?: boolean;
  onRotatePhrase?: (nextPhrase: string) => void;
};

export function FundCard({
  walletConnected,
  walletKind,
  walletSats,
  budgetSats,
  pendingConnect,
  pendingInvoice,
  pendingCommit,
  pendingDisconnect,
  error,
  deposit,
  onConnectNwc,
  onConnectLnbits,
  onDisconnect,
  onRefresh,
  onCreateInvoice,
  onCommit,
  maintenance,
  pendingMaintenance,
  onSetMaintenance,
  pendingRotate,
  onRotatePhrase,
}: FundCardProps) {
  const [method, setMethod] = useState<"nwc" | "lnbits">("nwc");
  const [nwc, setNwc] = useState("");
  const [lnbitsUrl, setLnbitsUrl] = useState("");
  const [lnbitsKey, setLnbitsKey] = useState("");
  const [selected, setSelected] = useState<number>(100_000);
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState(false);

  const [nextPhrase, setNextPhrase] = useState("");
  const [nextPhraseAgain, setNextPhraseAgain] = useState("");

  const customN = Number.parseInt(custom.replace(/[^\d]/g, ""), 10);
  const customValid =
    Number.isFinite(customN) && customN >= MIN_FUND_SATS && customN <= MAX_FUND_SATS;
  const amount = customValid ? customN : selected;
  const commitRoom = Math.max(0, walletSats - budgetSats);

  function connect(event: FormEvent) {
    event.preventDefault();
    if (method === "nwc") onConnectNwc(nwc);
    else onConnectLnbits(lnbitsUrl, lnbitsKey);
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
    <section
      id="load"
      className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
            Fill the spring
          </h2>
          <p className="mt-1 text-sm leading-normal text-muted">
            Connect your wallet, then pay a Lightning invoice. Visitors get real
            sats.
          </p>
        </div>
        {walletConnected ? (
          <Wallet className="mt-1 size-4 text-gold" aria-hidden />
        ) : (
          <Plus className="mt-1 size-4 text-gold" aria-hidden />
        )}
      </div>

      <div className="mt-4 rounded-md bg-bg px-3 py-3 shadow-[var(--shadow-border)]">
        <p className="text-sm font-medium text-fg">
          {maintenance ? "Spring is closed" : "Spring is open"}
        </p>
        <p className="mt-1 text-xs leading-normal text-subtle">
          {maintenance
            ? "Drink and fill are paused. Streaks stay frozen until you reopen."
            : "Close this if you need to move the Lightning wallet. Streaks freeze."}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          disabled={pendingMaintenance}
          onClick={() => onSetMaintenance(!maintenance)}
        >
          {pendingMaintenance
            ? "Saving…"
            : maintenance
              ? "Reopen the spring"
              : "Close for maintenance"}
        </Button>
      </div>

      {onRotatePhrase ? (
        <form
          className="mt-4 space-y-3 rounded-md bg-bg px-3 py-3 shadow-[var(--shadow-border)]"
          onSubmit={(event) => {
            event.preventDefault();
            if (nextPhrase !== nextPhraseAgain) return;
            onRotatePhrase(nextPhrase);
          }}
        >
          <p className="text-sm font-medium text-fg">New keeper phrase</p>
          <p className="text-xs leading-normal text-subtle">
            Six random dictionary words, written down offline. Not four. The
            old phrase dies when this saves.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              New phrase
            </span>
            <Input
              type="password"
              value={nextPhrase}
              onChange={(e) => setNextPhrase(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Repeat
            </span>
            <Input
              type="password"
              value={nextPhraseAgain}
              onChange={(e) => setNextPhraseAgain(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          {nextPhrase && nextPhrase !== nextPhraseAgain ? (
            <p className="text-xs text-danger">The two lines do not match.</p>
          ) : null}
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={
              pendingRotate ||
              nextPhrase.length < 11 ||
              nextPhrase !== nextPhraseAgain
            }
          >
            {pendingRotate ? "Saving…" : "Replace the phrase"}
          </Button>
        </form>
      ) : null}

      {!walletConnected ? (
        <form onSubmit={connect} className="mt-4 space-y-3">
          <div className="flex gap-2">
            {(
              [
                ["nwc", "NWC"],
                ["lnbits", "LNbits"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={cn(
                  "h-10 flex-1 rounded-md text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ease-out",
                  method === id
                    ? "bg-gold text-bg"
                    : "bg-surface-2 text-muted shadow-[var(--shadow-border)] hover:text-fg",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {method === "nwc" ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
                Nostr Wallet Connect
              </span>
              <textarea
                value={nwc}
                onChange={(e) => setNwc(e.target.value)}
                placeholder="nostr+walletconnect://…"
                autoComplete="off"
                spellCheck={false}
                rows={4}
                className="flex w-full rounded-md bg-bg px-3 py-2 font-mono text-xs text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:shadow-[0_0_0_1px_rgb(212_175_55_/_0.55),0_0_0_4px_rgb(212_175_55_/_0.16)]"
              />
              <span className="mt-1.5 block text-xs leading-normal text-subtle">
                Alby Hub, Alby Go, or Zeus: new app connection with pay, invoice,
                lookup, and balance.
              </span>
            </label>
          ) : (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
                  LNbits URL
                </span>
                <Input
                  value={lnbitsUrl}
                  onChange={(e) => setLnbitsUrl(e.target.value)}
                  placeholder="https://your-lnbits.example"
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
                  Admin key
                </span>
                <Input
                  type="password"
                  value={lnbitsKey}
                  onChange={(e) => setLnbitsKey(e.target.value)}
                  autoComplete="off"
                />
              </label>
            </>
          )}

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={
              pendingConnect ||
              (method === "nwc" ? nwc.trim().length < 20 : lnbitsUrl.length < 8 || lnbitsKey.length < 16)
            }
          >
            {pendingConnect ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Connecting
              </>
            ) : (
              "Connect spring wallet"
            )}
          </Button>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted uppercase">
                {walletKind === "lnbits" ? "LNbits" : "NWC"} wallet
              </p>
              <p className="font-mono text-sm tabular-nums text-fg">
                {formatSats(walletSats)} in wallet · {formatSats(budgetSats)} committed
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={pendingConnect}
              >
                Refresh
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label="Disconnect wallet"
                onClick={onDisconnect}
                disabled={pendingDisconnect}
              >
                <Unplug className="size-4" aria-hidden />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              Deposit invoice
            </p>
            <p className="mt-1 text-sm leading-normal text-muted">
              Pay from Phoenix, Cash App, Muun, or any Lightning wallet. When it
              clears, the spring fills.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FUND_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSelected(preset);
                  setCustom("");
                }}
                className={cn(
                  "h-10 rounded-md px-3 text-sm font-medium tabular-nums transition-[background-color,color,box-shadow] duration-150 ease-out",
                  !customValid && selected === preset
                    ? "bg-gold text-bg"
                    : "bg-surface-2 text-muted shadow-[var(--shadow-border)] hover:text-fg",
                )}
              >
                {preset >= 1_000_000
                  ? `${preset / 1_000_000}M`
                  : `${Math.round(preset / 1000)}k`}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
              Custom amount
            </span>
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={`${MIN_FUND_SATS.toLocaleString()} – ${MAX_FUND_SATS.toLocaleString()} sats`}
              inputMode="numeric"
            />
          </label>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={pendingInvoice || !amount}
            onClick={() => onCreateInvoice(amount)}
          >
            {pendingInvoice ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Creating invoice
              </>
            ) : (
              `Invoice ${formatSats(amount)}`
            )}
          </Button>

          {commitRoom >= MIN_FUND_SATS ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={pendingCommit}
              onClick={() => onCommit(Math.min(amount, commitRoom))}
            >
              {pendingCommit ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Committing
                </>
              ) : (
                `Commit ${formatSats(Math.min(amount, commitRoom))} already in wallet`
              )}
            </Button>
          ) : null}

          {deposit ? (
            <div className="rounded-lg bg-bg p-3 shadow-[var(--shadow-border)]">
              {deposit.paid ? (
                <p className="text-sm text-gold">
                  Invoice paid. {formatSats(deposit.amountSats)} added to the spring.
                </p>
              ) : (
                <>
                  <p className="text-center text-xs font-medium tracking-wide text-muted uppercase">
                    Waiting for {formatSats(deposit.amountSats)}
                  </p>
                  <img
                    src={deposit.qrDataUrl}
                    alt="Lightning invoice QR"
                    className="mx-auto mt-3 size-52 rounded-md"
                    width={208}
                    height={208}
                  />
                  <button
                    type="button"
                    onClick={() => void copyInvoice()}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-surface-2 px-3 py-2 font-mono text-xs text-muted hover:text-fg"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-gold" aria-hidden />
                    ) : (
                      <Copy className="size-3.5" aria-hidden />
                    )}
                    {copied ? "Copied invoice" : "Copy bolt11 invoice"}
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
