import { bech32 } from "bech32";
import { decode as decodeBolt11 } from "light-bolt11-decoder";
import { dbSource, getSql, type Sql } from "@/lib/db";
import type { WalletKind } from "@/lib/faucet";

/**
 * Legacy fallback salt. This used to be the *only* key material behind
 * wallet-secret encryption and shipped as a literal in this (now
 * open-sourced) file, so treat it as public — it gives no real secrecy.
 * Kept only so a wallet connected before this migration can still be
 * decrypted once; reconnect the wallet after deploying this change so it
 * gets re-wrapped under a real, non-public key.
 */
const LEGACY_WRAP_SALT =
  "203b3d51a0928f3621b2a3a3e43b400c3b2a9620e3249ca87e8a96dbb421285f";

const LNURL_TIMEOUT_MS = 8_000;
const WALLET_TIMEOUT_MS = 14_000;
const PAY_TIMEOUT_MS = 28_000;

export type WalletBlob = {
  kind: WalletKind;
  nwc?: string;
  lnbitsUrl?: string;
  lnbitsKey?: string;
};

type WalletRow = {
  wallet_kind: string | null;
  wallet_blob: string | null;
  wallet_sats: number | null;
  balance_sats: number;
};

export async function sha256Hex(value: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(value).digest("hex");
}

export async function ensureLightningSchema(sql: Sql): Promise<void> {
  await sql.query(
    "alter table faucet_pool add column if not exists wallet_kind text",
  );
  await sql.query(
    "alter table faucet_pool add column if not exists wallet_blob text",
  );
  await sql.query(
    "alter table faucet_pool add column if not exists wallet_sats integer not null default 0",
  );
  await sql.query(
    "alter table faucet_claims add column if not exists destination_hash text",
  );
  await sql.query(
    "alter table faucet_claims add column if not exists ip_hash text",
  );
  await sql.query(
    "alter table faucet_claims add column if not exists payment_hash text",
  );
  await sql.query(
    "alter table faucet_claims add column if not exists paid boolean not null default false",
  );
  await sql.query(`
    create table if not exists faucet_challenges (
      id text primary key,
      difficulty integer not null,
      ip_hash text not null default '',
      created_at timestamptz not null default now(),
      consumed_at timestamptz
    )
  `);
  await sql.query(`
    create table if not exists faucet_deposits (
      id serial primary key,
      checking_id text not null unique,
      amount_sats integer not null,
      bolt11 text not null,
      paid boolean not null default false,
      created_at timestamptz not null default now(),
      paid_at timestamptz
    )
  `);
  await sql.query(
    "alter table faucet_deposits add column if not exists ip_hash text",
  );
  await sql.query(
    "alter table faucet_deposits add column if not exists is_public boolean not null default false",
  );
  await sql.query(
    "alter table faucet_deposits add column if not exists dest_hash text",
  );
}

async function deriveWrapKey(material: string): Promise<Buffer> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(`fountain-wrap:${material}`).digest();
}

/** The real key, using whatever real secret is available in this environment. */
async function realWrapKey(): Promise<Buffer | null> {
  // Preferred if the deploy platform ever lets you set a custom var — not
  // required, since Grok's own deploy pipeline only documents injecting
  // DATABASE_URL / XAI_API_KEY / auth creds, with no custom-secret panel.
  const custom = process.env.WALLET_WRAP_KEY?.trim();
  if (custom && custom.length >= 16) return deriveWrapKey(`custom:${custom}`);
  // Falls back to DATABASE_URL: a real, platform-injected secret (a Neon
  // connection string with credentials) that is never written into source
  // or committed to the repo, unlike a hardcoded literal. This protects
  // against a leaked DB dump/backup, which carries table contents but not
  // the connection string used to reach it.
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl && dbUrl.length >= 16) return deriveWrapKey(`dburl:${dbUrl}`);
  return null;
}

let warnedMissingWrapKey = false;

/** Key used for new writes. On a real deploy this always resolves via DATABASE_URL. */
async function activeWrapKey(): Promise<Buffer> {
  const real = await realWrapKey();
  if (real) return real;
  if (dbSource === "neon") {
    // Defensive only — dbSource is "neon" precisely when DATABASE_URL is set
    // and non-empty, so realWrapKey() should already have returned above.
    throw new Error(
      "No real secret is available to wrap the wallet (DATABASE_URL missing or unusable).",
    );
  }
  if (!warnedMissingWrapKey) {
    warnedMissingWrapKey = true;
    console.warn(
      "[lightning] No real secret available (local pglite preview, no DATABASE_URL) — " +
        "using an insecure local-only fallback key. Fine for local/preview, never for production.",
    );
  }
  return deriveWrapKey(LEGACY_WRAP_SALT);
}

async function wrapSecret(plain: string): Promise<string> {
  const { createCipheriv, randomBytes } = await import("node:crypto");
  const key = await activeWrapKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v2.${iv.toString("hex")}.${tag.toString("hex")}.${enc.toString("hex")}`;
}

async function unwrapSecret(blob: string): Promise<string> {
  const { createDecipheriv } = await import("node:crypto");
  const parts = blob.split(".");
  const [version, ivHex, tagHex, encHex] = parts;
  if (parts.length !== 4 || !ivHex || !tagHex || !encHex) {
    throw new Error("Stored wallet is unreadable.");
  }
  let key: Buffer;
  if (version === "v2") {
    // Same key wrapSecret used: DATABASE_URL / WALLET_WRAP_KEY, or the
    // local-only fallback on pglite preview.
    key = await activeWrapKey();
  } else if (version === "v1") {
    // Pre-migration wallet secret, wrapped with the now-public legacy salt.
    key = await deriveWrapKey(LEGACY_WRAP_SALT);
  } else {
    throw new Error("Stored wallet is unreadable.");
  }
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "::1" ||
    h === "metadata.google.internal" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.startsWith("10.") ||
    h.startsWith("192.168.") ||
    h.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)
  ) {
    return true;
  }
  return false;
}

function assertPublicHttps(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That Lightning address could not be reached.");
  }
  if (url.protocol !== "https:") {
    throw new Error("Lightning addresses must use HTTPS.");
  }
  if (url.port && url.port !== "443") {
    throw new Error("That Lightning host is not allowed.");
  }
  const host = url.hostname;
  if (isBlockedHost(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) {
    throw new Error("That Lightning host is not allowed.");
  }
  return url;
}

function normalizeLnbitsUrl(raw: string): string {
  const url = new URL(raw.trim());
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("LNbits URL must start with https://");
  }
  if (isBlockedHost(url.hostname) && url.hostname !== "localhost") {
    throw new Error("That LNbits host is not allowed.");
  }
  const path = url.pathname.replace(/\/$/, "");
  return `${url.protocol}//${url.host}${path === "/" ? "" : path}`;
}

function validateNwcUrl(raw: string): string {
  const nwc = raw.trim();
  if (!/^nostr\+walletconnect:\/\//i.test(nwc)) {
    throw new Error("Paste a nostr+walletconnect:// connection string.");
  }
  const asHttp = nwc.replace(/^nostr\+walletconnect:/i, "https:");
  const url = new URL(asHttp);
  if (!url.searchParams.get("secret")) {
    throw new Error("That NWC string is missing a secret.");
  }
  if (!url.searchParams.get("relay") && !url.searchParams.getAll("relay").length) {
    throw new Error("That NWC string is missing a relay.");
  }
  return nwc;
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      accept: "application/json",
      "user-agent": "FountainOfYouth/1.0",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  if (text.length > 80_000) throw new Error("Lightning host returned too much data.");
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Lightning host returned invalid JSON.");
  }
  return { ok: response.ok, status: response.status, data };
}

export function invoiceAmountMsat(bolt11: string): number | null {
  try {
    const decoded = decodeBolt11(bolt11);
    const section = decoded.sections.find((s) => s.name === "amount");
    if (!section || !("value" in section)) return null;
    const n = Number.parseInt(String(section.value), 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function decodeLnurl(lnurl: string): string {
  const decoded = bech32.decode(lnurl.toLowerCase(), 2_500);
  if (decoded.prefix !== "lnurl") {
    throw new Error("That LNURL is not valid.");
  }
  const bytes = Uint8Array.from(bech32.fromWords(decoded.words));
  return new TextDecoder().decode(bytes);
}

export async function lnurlPayInvoice(
  destination: string,
  amountSats: number,
): Promise<string> {
  const dest = destination.trim();
  let lnurlpUrl: string;
  if (dest.includes("@")) {
    const [name, domain] = dest.split("@");
    if (!name || !domain) {
      throw new Error("Paste a Lightning address like you@wallet.com.");
    }
    lnurlpUrl = `https://${domain.toLowerCase()}/.well-known/lnurlp/${encodeURIComponent(name)}`;
  } else if (/^lnurl1[0-9a-z]+$/i.test(dest)) {
    lnurlpUrl = decodeLnurl(dest);
  } else {
    throw new Error("Paste a Lightning address like you@wallet.com.");
  }

  const safe = assertPublicHttps(lnurlpUrl);
  const first = await fetchJson(safe.toString(), { method: "GET" }, LNURL_TIMEOUT_MS);
  if (!first.ok || !first.data || typeof first.data !== "object") {
    throw new Error("That Lightning address did not answer.");
  }
  const pay = first.data as {
    tag?: string;
    callback?: string;
    minSendable?: number;
    maxSendable?: number;
  };
  if (pay.tag !== "payRequest" || !pay.callback) {
    throw new Error("That Lightning address cannot receive a pour.");
  }
  const callback = assertPublicHttps(pay.callback);
  const msat = amountSats * 1000;
  const min = Number(pay.minSendable ?? 0);
  const max = Number(pay.maxSendable ?? 0);
  if (Number.isFinite(min) && msat < min) {
    throw new Error("This wallet will not accept a pour that small. Try another address.");
  }
  if (Number.isFinite(max) && max > 0 && msat > max) {
    throw new Error("This wallet will not accept a pour that large. Try another address.");
  }

  const payUrl = new URL(callback.toString());
  payUrl.searchParams.set("amount", String(msat));
  const second = await fetchJson(payUrl.toString(), { method: "GET" }, LNURL_TIMEOUT_MS);
  if (!second.ok || !second.data || typeof second.data !== "object") {
    throw new Error("Could not request an invoice from that wallet.");
  }
  const pr = (second.data as { pr?: string }).pr;
  if (!pr || !/^ln(bc|tb)[0-9a-z]+$/i.test(pr)) {
    throw new Error("That wallet did not return a Lightning invoice.");
  }
  const invoiceMsat = invoiceAmountMsat(pr);
  if (invoiceMsat == null) {
    throw new Error("That invoice has no amount. Refusing to pay it.");
  }
  if (invoiceMsat > msat * 1.02 || invoiceMsat < msat * 0.98) {
    throw new Error("Invoice amount did not match the pour. Refusing to pay.");
  }
  return pr;
}

type NwcClient = {
  getBalance: () => Promise<{ balance: number }>;
  makeInvoice: (req: { amount: number; description?: string; expiry?: number }) => Promise<{
    invoice: string;
    payment_hash: string;
    state?: string;
    settled_at?: number;
    preimage?: string;
    amount?: number;
  }>;
  payInvoice: (req: { invoice: string }) => Promise<{ preimage?: string }>;
  lookupInvoice: (req: { payment_hash?: string; invoice?: string }) => Promise<{
    invoice?: string;
    payment_hash?: string;
    state?: string;
    settled_at?: number;
    preimage?: string;
    amount?: number;
  }>;
  close: () => void;
};

async function openNwc(nwc: string): Promise<NwcClient> {
  const { NWCClient } = await import("@getalby/sdk/nwc");
  return new NWCClient({ nostrWalletConnectUrl: nwc }) as unknown as NwcClient;
}

function nwcSettled(tx: {
  state?: string;
  settled_at?: number;
  preimage?: string;
}): boolean {
  if (tx.state === "settled") return true;
  if (tx.preimage && tx.preimage.length >= 8) return true;
  if (tx.settled_at && tx.settled_at > 0) return true;
  return false;
}

async function nwcBalanceSats(nwc: string): Promise<number> {
  const client = await openNwc(nwc);
  try {
    const res = await withTimeout(
      client.getBalance(),
      WALLET_TIMEOUT_MS,
      "Connected wallet did not answer.",
    );
    return Math.max(0, Math.floor(Number(res.balance) / 1000));
  } finally {
    client.close();
  }
}

async function lnbitsBalanceSats(url: string, key: string): Promise<number> {
  const res = await fetchJson(
    `${url}/api/v1/wallet`,
    { method: "GET", headers: { "X-Api-Key": key } },
    WALLET_TIMEOUT_MS,
  );
  if (!res.ok || !res.data || typeof res.data !== "object") {
    throw new Error("LNbits did not accept that admin key.");
  }
  const balance = Number((res.data as { balance?: number }).balance ?? 0);
  return Math.max(0, Math.floor(balance / 1000));
}

export async function probeWallet(blob: WalletBlob): Promise<number> {
  if (blob.kind === "nwc" && blob.nwc) {
    return nwcBalanceSats(blob.nwc);
  }
  if (blob.kind === "lnbits" && blob.lnbitsUrl && blob.lnbitsKey) {
    return lnbitsBalanceSats(blob.lnbitsUrl, blob.lnbitsKey);
  }
  throw new Error("Wallet is not configured.");
}

export async function makeDepositInvoice(
  blob: WalletBlob,
  amountSats: number,
): Promise<{ bolt11: string; checkingId: string }> {
  const memo = `Fountain of Youth · ${amountSats} sats`;
  if (blob.kind === "nwc" && blob.nwc) {
    const client = await openNwc(blob.nwc);
    try {
      const tx = await withTimeout(
        client.makeInvoice({
          amount: amountSats * 1000,
          description: memo,
          expiry: 900,
        }),
        WALLET_TIMEOUT_MS,
        "Wallet did not create an invoice.",
      );
      if (!tx.invoice) throw new Error("Wallet did not create an invoice.");
      return { bolt11: tx.invoice, checkingId: tx.payment_hash || tx.invoice };
    } finally {
      client.close();
    }
  }
  if (blob.kind === "lnbits" && blob.lnbitsUrl && blob.lnbitsKey) {
    const res = await fetchJson(
      `${blob.lnbitsUrl}/api/v1/payments`,
      {
        method: "POST",
        headers: {
          "X-Api-Key": blob.lnbitsKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          out: false,
          amount: amountSats,
          memo,
          expiry: 900,
        }),
      },
      WALLET_TIMEOUT_MS,
    );
    if (!res.ok || !res.data || typeof res.data !== "object") {
      throw new Error("LNbits could not create an invoice.");
    }
    const row = res.data as {
      payment_request?: string;
      bolt11?: string;
      payment_hash?: string;
      checking_id?: string;
    };
    const bolt11 = row.bolt11 || row.payment_request;
    const checkingId = row.checking_id || row.payment_hash;
    if (!bolt11 || !checkingId) throw new Error("LNbits could not create an invoice.");
    return { bolt11, checkingId };
  }
  throw new Error("Wallet is not configured.");
}

export async function lookupDepositPaid(
  blob: WalletBlob,
  checkingId: string,
): Promise<{ paid: boolean; amountSats: number }> {
  if (blob.kind === "nwc" && blob.nwc) {
    const client = await openNwc(blob.nwc);
    try {
      const tx = await withTimeout(
        client.lookupInvoice(
          checkingId.startsWith("ln")
            ? { invoice: checkingId }
            : { payment_hash: checkingId },
        ),
        WALLET_TIMEOUT_MS,
        "Wallet did not answer.",
      );
      const amountSats = Math.max(0, Math.floor(Number(tx.amount ?? 0) / 1000));
      return { paid: nwcSettled(tx), amountSats };
    } finally {
      client.close();
    }
  }
  if (blob.kind === "lnbits" && blob.lnbitsUrl && blob.lnbitsKey) {
    const res = await fetchJson(
      `${blob.lnbitsUrl}/api/v1/payments/${encodeURIComponent(checkingId)}`,
      { method: "GET", headers: { "X-Api-Key": blob.lnbitsKey } },
      WALLET_TIMEOUT_MS,
    );
    if (!res.ok || !res.data || typeof res.data !== "object") {
      return { paid: false, amountSats: 0 };
    }
    const row = res.data as { paid?: boolean; amount?: number };
    const amountSats = Math.max(0, Math.floor(Number(row.amount ?? 0) / 1000));
    return { paid: Boolean(row.paid), amountSats };
  }
  throw new Error("Wallet is not configured.");
}

export async function payBolt11(blob: WalletBlob, bolt11: string): Promise<string> {
  if (blob.kind === "nwc" && blob.nwc) {
    const client = await openNwc(blob.nwc);
    try {
      const res = await withTimeout(
        client.payInvoice({ invoice: bolt11 }),
        PAY_TIMEOUT_MS,
        "Payment timed out. The pour was not sent.",
      );
      return res.preimage || "paid";
    } finally {
      client.close();
    }
  }
  if (blob.kind === "lnbits" && blob.lnbitsUrl && blob.lnbitsKey) {
    const res = await fetchJson(
      `${blob.lnbitsUrl}/api/v1/payments`,
      {
        method: "POST",
        headers: {
          "X-Api-Key": blob.lnbitsKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({ out: true, bolt11 }),
      },
      PAY_TIMEOUT_MS,
    );
    if (!res.ok) {
      const detail =
        res.data && typeof res.data === "object"
          ? String((res.data as { detail?: string }).detail ?? "")
          : "";
      throw new Error(detail || "LNbits could not send the pour.");
    }
    const row = (res.data ?? {}) as { payment_hash?: string; preimage?: string };
    return row.payment_hash || row.preimage || "paid";
  }
  throw new Error("Wallet is not configured.");
}

export async function invoiceQrDataUrl(bolt11: string): Promise<string> {
  return textQrDataUrl(bolt11.toUpperCase());
}

export async function textQrDataUrl(value: string): Promise<string> {
  const qrMod = await import("qrcode");
  const QRCode = qrMod.default ?? qrMod;
  return QRCode.toDataURL(value, {
    margin: 1,
    width: 280,
    color: { dark: "#0c0a08", light: "#f4efe4" },
    errorCorrectionLevel: "M",
  });
}

export async function loadWallet(): Promise<{
  blob: WalletBlob;
  kind: WalletKind;
  walletSats: number;
  budgetSats: number;
} | null> {
  const sql = await getSql();
  await ensureLightningSchema(sql);
  const rows = await sql<WalletRow>`
    select wallet_kind, wallet_blob, wallet_sats, balance_sats
    from faucet_pool
    where id = 1
  `;
  const row = rows[0];
  if (!row?.wallet_kind || !row.wallet_blob) return null;
  if (row.wallet_kind !== "nwc" && row.wallet_kind !== "lnbits") return null;
  const json = await unwrapSecret(row.wallet_blob);
  const blob = JSON.parse(json) as WalletBlob;
  if (blob.kind !== row.wallet_kind) return null;
  if (row.wallet_blob.startsWith("v1.") && (await realWrapKey())) {
    try {
      const wrapped = await wrapSecret(json);
      await sql`update faucet_pool set wallet_blob = ${wrapped} where id = 1`;
    } catch {
      /* keep v1 if re-wrap fails; next connect will write v2 */
    }
  }
  return {
    blob,
    kind: blob.kind,
    walletSats: Number(row.wallet_sats ?? 0),
    budgetSats: Number(row.balance_sats ?? 0),
  };
}

export async function saveWallet(
  blob: WalletBlob,
  walletSats: number,
  zeroBudget: boolean,
): Promise<void> {
  const sql = await getSql();
  await ensureLightningSchema(sql);
  const wrapped = await wrapSecret(JSON.stringify(blob));
  if (zeroBudget) {
    await sql`
      update faucet_pool
      set
        wallet_kind = ${blob.kind},
        wallet_blob = ${wrapped},
        wallet_sats = ${walletSats},
        balance_sats = 0
      where id = 1
    `;
    return;
  }
  await sql`
    update faucet_pool
    set
      wallet_kind = ${blob.kind},
      wallet_blob = ${wrapped},
      wallet_sats = ${walletSats}
    where id = 1
  `;
}

export async function clearWallet(): Promise<void> {
  const sql = await getSql();
  await ensureLightningSchema(sql);
  await sql`
    update faucet_pool
    set wallet_kind = null, wallet_blob = null, wallet_sats = 0
    where id = 1
  `;
}

export async function setWalletSats(walletSats: number): Promise<void> {
  const sql = await getSql();
  await sql`
    update faucet_pool set wallet_sats = ${walletSats} where id = 1
  `;
}

export function buildNwcBlob(nwcUrl: string): WalletBlob {
  return { kind: "nwc", nwc: validateNwcUrl(nwcUrl) };
}

export function buildLnbitsBlob(url: string, key: string): WalletBlob {
  const lnbitsKey = key.trim();
  if (lnbitsKey.length < 16) throw new Error("That LNbits admin key looks too short.");
  return {
    kind: "lnbits",
    lnbitsUrl: normalizeLnbitsUrl(url),
    lnbitsKey,
  };
}
