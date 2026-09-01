import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Lock, LockOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ClaimCard, PourSuccess } from "@/components/claim-card";
import { DonationSplash } from "@/components/donation-splash";
import { Donorboard } from "@/components/donorboard";
import { FaucetWell } from "@/components/faucet-well";
import { FillSheet } from "@/components/fill-sheet";
import { FundCard } from "@/components/fund-card";
import { KeeperGate } from "@/components/keeper-gate";
import { Leaderboard } from "@/components/leaderboard";
import { RecentDrips } from "@/components/recent-drips";
import { StatsRow } from "@/components/stats-row";
import { Button } from "@/components/ui/button";
import {
  checkDeposit,
  checkPublicTip,
  claimSats,
  commitFromWallet,
  connectWallet,
  createChallenge,
  createDeposit,
  createPublicTip,
  disconnectWallet,
  getFaucetState,
  getWalletStatus,
  hideBasinDonor,
  rotateKeeper,
  setMaintenance,
  verifyKeeper,
} from "@/lib/faucet-api";
import {
  COOLDOWN_MS,
  KEEPER_SESSION_KEY,
  formatSats,
  getOrCreateClaimToken,
  donorLore,
  type ClaimOk,
  type DepositInvoice,
  type FaucetState,
  type RecentFill,
} from "@/lib/faucet";
import { solvePow, powEstimatedAttempts, PowCancelled } from "@/lib/pow-client";

export const Route = createFileRoute("/")({
  loader: () => getFaucetState(),
  component: Home,
});

function readKeeperSession(): string {
  try {
    return sessionStorage.getItem(KEEPER_SESSION_KEY) ?? "";
  } catch {
    return "";
  }
}

function Home() {
  const initial = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(0);
  const [pouring, setPouring] = useState(false);
  const [success, setSuccess] = useState<ClaimOk | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [fundError, setFundError] = useState<string | null>(null);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [keeperPhrase, setKeeperPhrase] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [keeperLockMs, setKeeperLockMs] = useState(0);
  const [deposit, setDeposit] = useState<DepositInvoice | null>(null);
  const [fillOpen, setFillOpen] = useState(false);
  const [fillError, setFillError] = useState<string | null>(null);
  const [lastCredit, setLastCredit] = useState<number | null>(null);
  const [tipDeposit, setTipDeposit] = useState<DepositInvoice | null>(null);
  const [newFill, setNewFill] = useState<RecentFill | null>(null);
  const seenFillIds = useRef<Set<number> | null>(null);
  const [powPhase, setPowPhase] = useState<
    "idle" | "challenge" | "solving" | "submitting"
  >("idle");
  const [powProgress, setPowProgress] = useState(0);
  const powAbortRef = useRef<AbortController | null>(null);
  const claimInFlight = useRef(false);

  const stateQuery = useQuery({
    queryKey: ["faucet"],
    queryFn: () => getFaucetState(),
    initialData: initial,
    refetchInterval: 12_000,
  });

  const isKeeper = keeperPhrase.length > 0;

  const walletQuery = useQuery({
    queryKey: ["wallet-status", keeperPhrase],
    queryFn: () => getWalletStatus({ data: { keeperPhrase } }),
    enabled: isKeeper,
  });

  useEffect(() => {
    setKeeperPhrase(readKeeperSession());
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const id = window.setTimeout(
      () => setCooldownMs((ms) => Math.max(0, ms - 1000)),
      1000,
    );
    return () => window.clearTimeout(id);
  }, [cooldownMs]);

  useEffect(() => {
    if (keeperLockMs <= 0) return;
    const id = window.setTimeout(
      () => setKeeperLockMs((ms) => Math.max(0, ms - 1000)),
      1000,
    );
    return () => window.clearTimeout(id);
  }, [keeperLockMs]);

  useEffect(() => {
    if (!isKeeper || !deposit || deposit.paid) return;
    let cancelled = false;
    const tick = async () => {
      const result = await checkDeposit({
        data: { keeperPhrase, checkingId: deposit.checkingId },
      });
      if (cancelled || !result.ok) return;
      if (result.paid) {
        setDeposit((prev) => (prev ? { ...prev, paid: true } : prev));
        toast.success(`Filled ${formatSats(result.amount ?? deposit.amountSats)}`);
        void queryClient.invalidateQueries({ queryKey: ["faucet"] });
        void queryClient.invalidateQueries({ queryKey: ["wallet-status"] });
      }
    };
    const id = window.setInterval(() => void tick(), 2500);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [deposit, isKeeper, keeperPhrase, queryClient]);

  useEffect(() => {
    if (!tipDeposit || tipDeposit.paid) return;
    let cancelled = false;
    const tick = async () => {
      const result = await checkPublicTip({
        data: { checkingId: tipDeposit.checkingId },
      });
      if (cancelled || !result.ok) return;
      if (result.paid) {
        const amount = result.amount ?? tipDeposit.amountSats;
        setTipDeposit((prev) => (prev ? { ...prev, paid: true } : prev));
        setLastCredit(amount);
        toast.success(donorLore(amount));
        void queryClient.invalidateQueries({ queryKey: ["faucet"] });
        void queryClient.invalidateQueries({ queryKey: ["wallet-status"] });
      }
    };
    const id = window.setInterval(() => void tick(), 2500);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [queryClient, tipDeposit]);

  useEffect(() => {
    const fills = stateQuery.data?.recentFills;
    if (!fills) return;
    if (seenFillIds.current === null) {
      // First load: don't announce history, just remember what already happened.
      seenFillIds.current = new Set(fills.map((f) => f.id));
      return;
    }
    const fresh = fills.find((f) => !seenFillIds.current!.has(f.id));
    if (fresh) {
      seenFillIds.current = new Set(fills.map((f) => f.id));
      setNewFill(fresh);
    }
  }, [stateQuery.data?.recentFills]);

  const claimMutation = useMutation({
    mutationFn: async ({
      destination,
      honeypot,
      username,
    }: {
      destination: string;
      honeypot: string;
      username: string;
    }) => {
      if (claimInFlight.current) {
        return { ok: false as const, error: "" };
      }
      claimInFlight.current = true;
      setPowPhase("challenge");
      setPowProgress(0);
      try {
      const challenge = await createChallenge({ data: {} });
      if (!challenge.ok) {
        return { ok: false as const, error: challenge.error };
      }
      setPowPhase("solving");
      const controller = new AbortController();
      powAbortRef.current = controller;
      const estimated = powEstimatedAttempts(challenge.difficulty);
      try {
        const nonce = await solvePow(challenge.id, challenge.difficulty, {
          signal: controller.signal,
          onProgress: (n) => setPowProgress(Math.min(0.96, n / estimated)),
        });
        setPowProgress(1);
        setPowPhase("submitting");
        return await claimSats({
          data: {
            destination,
            claimToken: getOrCreateClaimToken(),
            challengeId: challenge.id,
            nonce,
            honeypot,
            username,
          },
        });
      } catch (err) {
        if (err instanceof PowCancelled) {
          return { ok: false as const, error: "" };
        }
        throw err;
      } finally {
        powAbortRef.current = null;
      }
      } finally {
        claimInFlight.current = false;
      }
    },
    onMutate: () => {
      setClaimError(null);
      setPouring(true);
    },
    onSuccess: (result) => {
      if (result.ok) {
        setClaimError(null);
        setSuccess(result);
        setCooldownMs(COOLDOWN_MS);
        void queryClient.invalidateQueries({ queryKey: ["faucet"] });
        void queryClient.invalidateQueries({ queryKey: ["drinker"] });
        return;
      }
      if (result.error) setClaimError(result.error);
      if (result.retryAfterMs) setCooldownMs(result.retryAfterMs);
    },
    onError: () => {
      setClaimError("Could not reach the fountain. Try again.");
    },
    onSettled: () => {
      setPowPhase("idle");
      setPowProgress(0);
      window.setTimeout(() => setPouring(false), 1100);
    },
  });

  function cancelPow() {
    powAbortRef.current?.abort();
  }

  const keeperMutation = useMutation({
    mutationFn: (phrase: string) => verifyKeeper({ data: { phrase } }),
    onMutate: () => setGateError(null),
    onSuccess: (result, phrase) => {
      if (!result.ok) {
        setGateError(result.error);
        setKeeperLockMs(result.retryAfterMs ?? 0);
        return;
      }
      setKeeperLockMs(0);
      try {
        sessionStorage.setItem(KEEPER_SESSION_KEY, phrase);
      } catch {
        /* ignore */
      }
      setKeeperPhrase(phrase);
      setGateOpen(false);
      toast.success("Spring unlocked");
    },
    onError: () => setGateError("Could not reach the fountain."),
  });

  const maintenanceMutation = useMutation({
    mutationFn: (on: boolean) =>
      setMaintenance({ data: { keeperPhrase, on } }),
    onSuccess: (result) => {
      if (!result.ok) {
        setFundError(result.error);
        return;
      }
      toast.success(
        result.maintenance
          ? "Spring closed. Streaks frozen."
          : "Spring is open again.",
      );
      void queryClient.invalidateQueries({ queryKey: ["faucet"] });
    },
    onError: () => setFundError("Could not change maintenance."),
  });

  const hideDonorMutation = useMutation({
    mutationFn: (mask: string) =>
      hideBasinDonor({ data: { keeperPhrase, mask } }),
    onSuccess: (result) => {
      if (!result.ok) {
        setFundError(result.error);
        return;
      }
      toast.success("Removed from the basin. The sats stay in the pot.");
      void queryClient.invalidateQueries({ queryKey: ["faucet"] });
    },
  });

  const rotateKeeperMutation = useMutation({
    mutationFn: (nextPhrase: string) =>
      rotateKeeper({ data: { keeperPhrase, nextPhrase } }),
    onSuccess: (result, nextPhrase) => {
      if (!result.ok) {
        setFundError(result.error);
        return;
      }
      setKeeperPhrase(nextPhrase);
      try {
        sessionStorage.setItem(KEEPER_SESSION_KEY, nextPhrase);
      } catch {
        /* ignore */
      }
      toast.success("Keeper phrase replaced. Write the new one down.");
    },
    onError: () => setFundError("Could not replace the phrase."),
  });

  const connectMutation = useMutation({
    mutationFn: (input: {
      kind: "nwc" | "lnbits";
      nwcUrl?: string;
      lnbitsUrl?: string;
      lnbitsKey?: string;
    }) =>
      connectWallet({
        data: { keeperPhrase, ...input },
      }),
    onMutate: () => setFundError(null),
    onSuccess: (result) => {
      if (!result.ok) {
        setFundError(result.error);
        return;
      }
      toast.success("Wallet connected");
      void queryClient.invalidateQueries({ queryKey: ["wallet-status"] });
      void queryClient.invalidateQueries({ queryKey: ["faucet"] });
    },
    onError: () => setFundError("Could not connect that wallet."),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectWallet({ data: { keeperPhrase } }),
    onSuccess: (result) => {
      if (!result.ok) {
        setFundError(result.error);
        return;
      }
      setDeposit(null);
      toast.success("Wallet disconnected");
      void queryClient.invalidateQueries({ queryKey: ["wallet-status"] });
      void queryClient.invalidateQueries({ queryKey: ["faucet"] });
    },
  });

  const invoiceMutation = useMutation({
    mutationFn: (amountSats: number) =>
      createDeposit({ data: { keeperPhrase, amountSats } }),
    onMutate: () => setFundError(null),
    onSuccess: (result) => {
      if (!result.ok) {
        setFundError(result.error);
        return;
      }
      setDeposit(result.deposit);
    },
    onError: () => setFundError("Could not create an invoice."),
  });

  const commitMutation = useMutation({
    mutationFn: (amountSats: number) =>
      commitFromWallet({ data: { keeperPhrase, amountSats } }),
    onMutate: () => setFundError(null),
    onSuccess: (result) => {
      if (!result.ok) {
        setFundError(result.error);
        return;
      }
      toast.success(`Committed ${formatSats(result.amount)}`);
      void queryClient.invalidateQueries({ queryKey: ["faucet"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-status"] });
    },
    onError: () => setFundError("Could not commit from the wallet."),
  });

  const refreshMutation = useMutation({
    mutationFn: () =>
      getWalletStatus({ data: { keeperPhrase, refresh: true } }),
    onSuccess: (result) => {
      if (!result.ok) {
        setFundError(result.error);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["wallet-status"] });
      void queryClient.invalidateQueries({ queryKey: ["faucet"] });
    },
  });

  const publicTipMutation = useMutation({
    mutationFn: ({
      destination,
      amountSats,
    }: {
      destination: string;
      amountSats: number;
    }) => createPublicTip({ data: { destination, amountSats } }),
    onMutate: () => setFillError(null),
    onSuccess: (result) => {
      if (!result.ok) {
        setFillError(result.error);
        return;
      }
      setTipDeposit(result.deposit);
    },
    onError: () => setFillError("Could not create a tip invoice."),
  });

  function lockSpring() {
    try {
      sessionStorage.removeItem(KEEPER_SESSION_KEY);
    } catch {
      /* ignore */
    }
    setKeeperPhrase("");
    setFundError(null);
    setDeposit(null);
  }

  function openFill() {
    setFillError(null);
    setLastCredit(null);
    setTipDeposit(null);
    setFillOpen(true);
  }

  const state: FaucetState | undefined = stateQuery.data;
  const walletStatus = walletQuery.data && walletQuery.data.ok ? walletQuery.data : null;
  const walletConnected = walletStatus?.connected ?? state?.walletConnected ?? false;
  const balance = walletConnected ? (state?.balance ?? 0) : 0;
  const maintenance = state?.maintenance ?? false;
  const sealed = !walletConnected;
  const dry = !sealed && balance < 21;
  const flowing = !sealed && !dry && !maintenance;

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <a href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold font-display text-sm font-semibold text-bg">
            ₿
          </span>
          <span className="truncate font-display text-lg font-semibold tracking-tight text-fg">
            Fountain of Youth
          </span>
        </a>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted shadow-[var(--shadow-border)]">
            <span
              className={`live-dot size-1.5 rounded-full ${
                flowing ? "bg-gold" : sealed || maintenance ? "bg-subtle" : "bg-danger"
              }`}
            />
            {maintenance ? "Maintenance" : flowing ? "Flowing" : sealed ? "Sealed" : "Dry"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 text-muted hover:text-gold"
            aria-label={isKeeper ? "Lock the spring" : "Keeper"}
            onClick={() => {
              if (isKeeper) lockSpring();
              else {
                setGateError(null);
                setGateOpen(true);
              }
            }}
          >
            {isKeeper ? (
              <LockOpen className="size-4" aria-hidden />
            ) : (
              <Lock className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        {maintenance ? (
          <div
            role="status"
            className="mx-auto mt-2 max-w-2xl rounded-xl bg-surface px-4 py-3 text-center shadow-[var(--shadow-border)] sm:mt-4"
          >
            <p className="font-display text-sm font-semibold tracking-tight text-gold">
              Under maintenance
            </p>
            <p className="mt-1 text-sm leading-normal text-muted">
              The keeper is moving Lightning. Drink and fill are paused for a
              day or two. Your streak is frozen — it will not break while the
              spring is closed.
            </p>
          </div>
        ) : null}

        <div className="stagger-in mx-auto max-w-2xl pt-2 text-center sm:pt-8">
          <p className="text-xs font-medium tracking-[0.22em] text-gold uppercase">
            The fountain of youth
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-tight text-fg sm:mt-3 sm:text-5xl">
            Drink a random pour.
          </h1>
          <p className="mx-auto mt-2 hidden max-w-lg text-base leading-normal text-muted sm:mt-3 sm:block">
            Paste a Lightning address. The fountain pays a random pour over
            Lightning — twenty-one sats up to a jackpot that grows with the
            spring.
          </p>
        </div>

        <div className="relative mt-3 sm:mt-8">
          <DonationSplash fill={newFill} />
          <FaucetWell balance={balance} pouring={pouring} onFill={openFill} />
        </div>

        <div className="mt-2 text-center">
          {stateQuery.isLoading ? (
            <p className="font-mono text-sm text-subtle">Reading the spring…</p>
          ) : stateQuery.isError ? (
            <p className="text-sm text-danger">Could not read the fountain.</p>
          ) : sealed ? (
            <p className="font-mono text-sm tabular-nums text-muted">
              Sealed — waiting for the keeper
            </p>
          ) : (
            <>
              <p className="font-mono text-sm tabular-nums text-muted">
                {formatSats(balance)} remaining
                {state?.jackpotSats
                  ? ` · jackpot ${formatSats(state.jackpotSats)}`
                  : ""}
              </p>
              <p className="mt-1 text-xs text-subtle">Tap the fountain to fill</p>
            </>
          )}
        </div>

        <div className="mt-5">
          <StatsRow
            balance={balance}
            totalClaimed={state?.totalClaimed ?? 0}
            claimCount={state?.claimCount ?? 0}
          />
        </div>

        <div
          className={`mt-4 grid grid-cols-1 gap-4 ${isKeeper ? "lg:grid-cols-2" : ""}`}
        >
          <ClaimCard
            disabled={stateQuery.isLoading || stateQuery.isError || maintenance}
            dry={dry}
            sealed={sealed}
            maintenance={maintenance}
            pending={claimMutation.isPending || pouring}
            error={claimError}
            cooldownMs={cooldownMs}
            powPhase={powPhase}
            powProgress={powProgress}
            onCancelPow={cancelPow}
            onClaim={(destination, honeypot, username) =>
              claimMutation.mutate({ destination, honeypot, username })
            }
          />
          {isKeeper ? (
            <FundCard
              walletConnected={walletConnected}
              walletKind={walletStatus?.kind ?? state?.walletKind ?? null}
              walletSats={walletStatus?.walletSats ?? 0}
              budgetSats={walletStatus?.budgetSats ?? balance}
              pendingConnect={connectMutation.isPending}
              pendingInvoice={invoiceMutation.isPending}
              pendingCommit={commitMutation.isPending}
              pendingDisconnect={disconnectMutation.isPending}
              error={fundError}
              deposit={deposit}
              onConnectNwc={(url) =>
                connectMutation.mutate({ kind: "nwc", nwcUrl: url })
              }
              onConnectLnbits={(url, key) =>
                connectMutation.mutate({
                  kind: "lnbits",
                  lnbitsUrl: url,
                  lnbitsKey: key,
                })
              }
              onDisconnect={() => disconnectMutation.mutate()}
              onRefresh={() => refreshMutation.mutate()}
              onCreateInvoice={(amountSats) => invoiceMutation.mutate(amountSats)}
              onCommit={(amountSats) => commitMutation.mutate(amountSats)}
              maintenance={maintenance}
              pendingMaintenance={maintenanceMutation.isPending}
              onSetMaintenance={(on) => maintenanceMutation.mutate(on)}
              pendingRotate={rotateKeeperMutation.isPending}
              onRotatePhrase={(nextPhrase) =>
                rotateKeeperMutation.mutate(nextPhrase)
              }
            />
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecentDrips pours={state?.recent ?? []} now={now} />
          <Leaderboard
            bySats={state?.boardSats ?? []}
            byStreak={state?.boardStreak ?? []}
            maintenance={maintenance}
          />
        </div>

        <div className="mt-4">
          <Donorboard
            donors={state?.boardDonors ?? []}
            keeper={isKeeper}
            onHide={(mask) => hideDonorMutation.mutate(mask)}
          />
        </div>

        <section className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Aim",
              body: "Drop in a Lightning address like name@walletofsatoshi.com or you@getalby.com.",
            },
            {
              step: "02",
              title: "Drink",
              body: "A puzzle proves you are not a bot. Then the fountain pays a random pour. A fuller spring pours more.",
            },
            {
              step: "03",
              title: "Return",
              body: "Each UTC day adds a streak and 0.1% jackpot odds, capped at +5%. Streaks tilt the chance, not the size.",
            },
          ].map((item) => (
            <div key={item.step}>
              <p className="font-mono text-xs tabular-nums text-gold">{item.step}</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-fg">
                {item.title}
              </h3>
              <p className="mt-1 text-sm leading-normal text-muted">{item.body}</p>
            </div>
          ))}
        </section>

        <p className="mt-12 max-w-2xl text-xs leading-normal text-subtle">
          <Link
            to="/changelog"
            className="text-gold underline-offset-2 hover:underline"
          >
            v1.3
          </Link>
          . Fountain of Youth pays real satoshis over Lightning from the
          keeper’s connected wallet. One drink per address per day. Streaks,
          Legacy, and the leaderboard count paid pours only. No accounts. IP
          hashed for rate limits. Lightning address hashed for streaks. No data
          sold.{" "}
          <button
            type="button"
            className="text-gold underline-offset-2 hover:underline"
            onClick={openFill}
          >
            Fill the spring
          </button>
          . Tips are Lightning invoices, max 10,000 sats, one address per day.
          100% to pours.
        </p>
        <nav className="mt-3 flex max-w-2xl flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
          <Link to="/faq" className="text-gold underline-offset-2 hover:underline">
            FAQ
          </Link>
          <Link
            to="/changelog"
            className="text-gold underline-offset-2 hover:underline"
          >
            Changelog
          </Link>
          <Link
            to="/feedback"
            className="text-gold underline-offset-2 hover:underline"
          >
            Feedback
          </Link>
          <Link
            to="/privacy"
            className="text-gold underline-offset-2 hover:underline"
          >
            Privacy
          </Link>
          <Link to="/terms" className="text-gold underline-offset-2 hover:underline">
            Terms
          </Link>
          <a
            href="https://github.com/DrSteve2005"
            target="_blank"
            rel="noreferrer"
            className="text-gold underline-offset-2 hover:underline"
          >
            GitHub
          </a>
        </nav>
      </main>
      {success ? (
        <PourSuccess
          pour={success}
          onDismiss={() => setSuccess(null)}
        />
      ) : null}
      <FillSheet
        open={fillOpen}
        sealed={sealed || maintenance}
        pending={publicTipMutation.isPending}
        error={fillError}
        lastCredit={lastCredit}
        deposit={tipDeposit}
        onCreate={(destination, amountSats) =>
          publicTipMutation.mutate({ destination, amountSats })
        }
        onClose={() => setFillOpen(false)}
      />
      <KeeperGate
        open={gateOpen}
        pending={keeperMutation.isPending}
        error={gateError}
        lockMs={keeperLockMs}
        onClose={() => setGateOpen(false)}
        onUnlock={(phrase) => keeperMutation.mutate(phrase)}
      />
    </div>
  );
}
