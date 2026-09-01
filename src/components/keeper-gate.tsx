import { useState, type FormEvent } from "react";
import { LoaderCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type KeeperGateProps = {
  open: boolean;
  pending: boolean;
  error: string | null;
  lockMs?: number;
  onClose: () => void;
  onUnlock: (phrase: string) => void;
};

function formatLock(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec <= 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function KeeperGate({
  open,
  pending,
  error,
  lockMs = 0,
  onClose,
  onUnlock,
}: KeeperGateProps) {
  const [phrase, setPhrase] = useState("");
  const locked = lockMs > 0;

  if (!open) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!phrase.trim() || pending || locked) return;
    onUnlock(phrase);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keeper-title"
      onClick={onClose}
    >
      <form
        className="w-full max-w-md rounded-xl bg-surface p-6 shadow-[var(--shadow-border)] sm:p-7"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <p className="text-xs font-medium tracking-[0.18em] text-gold uppercase">
          Private
        </p>
        <h2
          id="keeper-title"
          className="mt-2 font-display text-2xl font-semibold tracking-tight text-fg"
        >
          Keeper of the spring
        </h2>
        <p className="mt-2 text-sm leading-normal text-muted">
          Only the keeper connects the wallet. Anyone can tip the spring with the
          fountain. Visitors drink; they do not run the vault.
        </p>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
            Phrase
          </span>
          <Input
            type="password"
            autoComplete="off"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoFocus
            disabled={locked}
          />
        </label>
        {error ? (
          <p className="mt-2 text-sm text-danger" role="alert">
            {error}
            {locked ? ` Try again in ${formatLock(lockMs)}.` : null}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={pending || locked || !phrase.trim()}
          >
            {pending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Checking
              </>
            ) : locked ? (
              <>
                <Lock className="size-4" aria-hidden />
                Locked ({formatLock(lockMs)})
              </>
            ) : (
              <>
                <Lock className="size-4" aria-hidden />
                Unlock
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
