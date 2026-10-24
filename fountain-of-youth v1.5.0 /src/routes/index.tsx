import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Lock, LockOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ClaimCard, PourSuccess } from "@/components/claim-card";
import { DonationSplash } from "@/components/donation-splash";
import { FaucetWell } from "@/components/faucet-well";
import { FillSheet } from "@/components/fill-sheet";
import { FundCard } from "@/components/fund-card";
import { KeeperGate } from "@/components/keeper-gate";
import { KeeperWatch } from "@/components/keeper-watch";
import { LangToggle } from "@/components/lang-toggle";
import { Leaderboard, JackOLantern } from "@/components/leaderboard";
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
  getKeeperWatch,
  getWalletStatus,
  hideBasinDonor,
  listFillBlocks,
  blockFillAddress,
  unblockFillAddress,
  rotateKeeper,
  setMaintenance,
  verifyKeeper,
} from "@/lib/faucet-api";
import {
  COOLDOWN_MS,
  KEEPER_SESSION_KEY,
  formatSats,
  getOrCreateClaimToken,
  hallowNightsLeft,
  isHallowSeason,
  refillMoment,
  formatRefillWait,
  donorLore,
  type ClaimOk,
  type DepositInvoice,
  type FaucetState,
  type RecentFill,
} from "@/lib/faucet";
import { solvePow, powEstimatedAttempts, PowCancelled } from "@/lib/pow-client";
import { useI18n } from "@/lib/i18n";

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

function RefillCountdown() {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const moment = refillMoment(new Date(now));
  if (moment.phase === "gone") return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-medium tracking-[0.22em] text-gold uppercase">
        {t("refill.kicker")}
      </p>
      {moment.phase === "wait" ? (
        <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-fg tabular-nums">
          {formatRefillWait(moment.ms)}
        </p>
      ) : null}
      <p className="mt-1 text-sm text-muted">
        {moment.phase === "today" ? t("refill.today") : t("refill.wait")}
      </p>
    </div>
  );
}

function Home() {
  const { t, locale } = useI18n();
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
    refetchInterval: 12_000,
  });

  const watchQuery = useQuery({
    queryKey: ["keeper-watch", keeperPhrase],
    queryFn: () => getKeeperWatch({ data: { keeperPhrase } }),
    enabled: isKeeper,
    refetchInterval: 60_000,
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
      const challenge = await createChallenge({ data: { destination } });
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
        void queryClient.invalidateQueries({ queryKey: ["wallet-status"] });
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
    mutationFn: (mask: string) => hideBasinDonor({ data: { keeperPhrase, mask } }),
    onSuccess: (result) => {
      if (!result.ok) {
        setFundError(result.error);
        return;
      }
      toast.success("Removed from the basin. The sats stay in the pot.");
      void queryClient.invalidateQueries({ queryKey: ["faucet"] });
    },
  });

  const fillBlocksQuery = useQuery({
    queryKey: ["fill-blocks", keeperPhrase],
    queryFn: () => listFillBlocks({ data: { keeperPhrase } }),
    enabled: isKeeper,
  });

  const blockFillMutation = useMutation({
    mutationFn: (address: string) =>
      blockFillAddress({ data: { keeperPhrase, address } }),
    onSuccess: (result) => {
      if (!result.ok) {
        setFundError(result.error);
        return;
      }
      setFundError(null);
      void queryClient.invalidateQueries({ queryKey: ["fill-blocks", keeperPhrase] });
    },
    onError: () => setFundError("Could not update the fill list."),
  });

  const unblockFillMutation = useMutation({
    mutationFn: (address: string) =>
      unblockFillAddress({ data: { keeperPhrase, address } }),
    onSuccess: (result) => {
      if (!result.ok) {
        setFundError(result.error);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["fill-blocks", keeperPhrase] });
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
          <LangToggle />
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
              {t("maint.title")}
            </p>
            <p className="mt-1 text-sm leading-normal text-muted">
              {t("maint.body")}
            </p>
          </div>
        ) : null}

        <div className="stagger-in mx-auto max-w-2xl pt-2 text-center sm:pt-8">
          <p className="text-xs font-medium tracking-[0.22em] text-gold uppercase">
            {t("hero.kicker")}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-tight text-fg sm:mt-3 sm:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-2 hidden max-w-lg text-base leading-normal text-muted sm:mt-3 sm:block">
            {t("hero.body")}
          </p>
          {isHallowSeason() ? (
            <div className="relative mx-auto mt-5 max-w-md overflow-hidden rounded-xl bg-surface px-4 py-4 text-center shadow-[var(--shadow-border)]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-8 h-24"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgb(196 92 74 / 0.22), transparent 70%)",
                }}
              />
              <p className="relative font-mono text-[11px] tracking-[0.18em] text-gold uppercase">
                {hallowNightsLeft() <= 1
                  ? t("hallow.nightsOne")
                  : t("hallow.nights", { n: hallowNightsLeft() })}
              </p>
              <p className="relative mt-2 flex items-center justify-center gap-2 font-display text-lg font-semibold tracking-tight text-gold">
                <JackOLantern className="size-6" />
                {t("hallow.kicker")}
              </p>
              <p className="relative mt-1 text-sm leading-normal text-muted">
                {t("hallow.body")}
              </p>
            </div>
          ) : null}
        </div>

        <div className="relative mt-3 sm:mt-8">
          <DonationSplash fill={newFill} />
          <FaucetWell balance={balance} pouring={pouring} onFill={openFill} />
        </div>

        <div className="mt-2 text-center">
          {stateQuery.isLoading ? (
            <p className="font-mono text-sm text-subtle">{t("well.reading")}</p>
          ) : stateQuery.isError ? (
            <p className="text-sm text-danger">{t("well.readFail")}</p>
          ) : sealed ? (
            <p className="font-mono text-sm tabular-nums text-muted">
              {t("well.sealed")}
            </p>
          ) : (
            <>
              <p className="font-mono text-sm tabular-nums text-muted">
                {t("well.remaining", { sats: formatSats(balance, locale) })}
                {state?.jackpotSats
                  ? t("well.jackpot", { sats: formatSats(state.jackpotSats, locale) })
                  : ""}
              </p>
              <p className="mt-1 text-xs text-subtle">{t("well.tap")}</p>
            </>
          )}
          <RefillCountdown />
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
              daySpentSats={walletStatus?.daySpentSats ?? 0}
              dayBudgetSats={walletStatus?.dayBudgetSats ?? 0}
              dayCapOff={walletStatus?.dayCapOff ?? false}
              dayJackpotClaimed={walletStatus?.dayJackpotClaimed ?? false}
              dayJackpotSats={walletStatus?.dayJackpotSats ?? 0}
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
              blockedAddresses={
                fillBlocksQuery.data?.ok ? fillBlocksQuery.data.addresses : []
              }
              pendingBlock={blockFillMutation.isPending || unblockFillMutation.isPending}
              onBlockAddress={(address) => blockFillMutation.mutate(address)}
              onUnblockAddress={(address) => unblockFillMutation.mutate(address)}
            />
          ) : null}
        </div>

        {isKeeper ? (
          <div className="mt-4">
            <KeeperWatch
              watch={watchQuery.data && watchQuery.data.ok ? watchQuery.data : null}
              pending={watchQuery.isLoading}
            />
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecentDrips pours={state?.recent ?? []} now={now} />
          <Leaderboard
            bySats={state?.boardSats ?? []}
            byStreak={state?.boardStreak ?? []}
            donors={state?.boardDonors ?? []}
            maintenance={maintenance}
            keeper={isKeeper}
            onHideDonor={(mask) => hideDonorMutation.mutate(mask)}
          />
        </div>

        <section className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: t("how.aimTitle"),
              body: t("how.aimBody"),
            },
            {
              step: "02",
              title: t("how.drinkTitle"),
              body: t("how.drinkBody"),
            },
            {
              step: "03",
              title: t("how.returnTitle"),
              body: t("how.returnBody"),
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
            v1.5.0
          </Link>
          . {t("footer.blurb")}{" "}
          <button
            type="button"
            className="text-gold underline-offset-2 hover:underline"
            onClick={openFill}
          >
            {t("footer.fill")}
          </button>
          . {t("footer.tips")}
        </p>
        <nav className="mt-3 flex max-w-2xl flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
          <Link to="/faq" className="text-gold underline-offset-2 hover:underline">
            {t("nav.faq")}
          </Link>
          <Link
            to="/embed"
            className="text-gold underline-offset-2 hover:underline"
          >
            {t("nav.embed")}
          </Link>
          <Link
            to="/changelog"
            className="text-gold underline-offset-2 hover:underline"
          >
            {t("nav.changelog")}
          </Link>
          <Link
            to="/feedback"
            className="text-gold underline-offset-2 hover:underline"
          >
            {t("nav.feedback")}
          </Link>
          <Link
            to="/privacy"
            className="text-gold underline-offset-2 hover:underline"
          >
            {t("nav.privacy")}
          </Link>
          <Link to="/terms" className="text-gold underline-offset-2 hover:underline">
            {t("nav.terms")}
          </Link>
          <a
            href="https://github.com/DrSteve2005/fountain-of-youth"
            target="_blank"
            rel="noreferrer"
            className="text-gold underline-offset-2 hover:underline"
          >
            {t("nav.github")}
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
