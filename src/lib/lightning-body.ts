const HOST_PAGE = "LIGHTNING_HOST_PAGE";

export const INVOICE_PAGE =
  "That wallet sent a page instead of an invoice. The address was not rejected. Try again, or use another one.";
export const INVOICE_SOFT =
  "That wallet could not make an invoice. The address was not rejected. Try again.";
export const ADDRESS_MISSING =
  "That Lightning address was not found. Check it and try again.";
export const PAY_OFFLINE =
  "The spring could not send the pour. Your address is fine. The keeper's wallet may be empty or offline.";
export const PAY_SLOW =
  "The spring could not send the pour in time. Your address is fine. Try again.";
export const WALLET_LOW =
  "The connected wallet does not have enough sats for a pour.";

/** Parse a Lightning HTTP body. `undefined` means it was not JSON (often an HTML error page). */
export function parseLightningBody(text: string): unknown {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    if (cleaned.startsWith("<") || /^<!doctype/i.test(cleaned.slice(0, 20))) {
      return undefined;
    }
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start && start < 80) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

/** LUD-06 error object, mapped so a host failure is not "your address is invalid". */
export function lnurlProblem(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const row = data as { status?: string; reason?: string };
  if (String(row.status ?? "").toUpperCase() !== "ERROR") return null;
  const reason = String(row.reason ?? "")
    .replace(/<[^>]*>/g, "")
    .trim();
  if (/not found|unknown user|no such|does not exist|unregistered|invalid user/i.test(reason)) {
    return ADDRESS_MISSING;
  }
  if (/amount|too small|too large|minimum|maximum|msat/i.test(reason)) {
    return "This wallet will not accept that pour size. Try another address.";
  }
  return INVOICE_SOFT;
}

export function invoiceFailureMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (
    message === HOST_PAGE ||
    message === INVOICE_PAGE ||
    /invalid JSON|too much data/i.test(message)
  ) {
    return INVOICE_PAGE;
  }
  if (
    message === INVOICE_SOFT ||
    message === ADDRESS_MISSING ||
    message.startsWith("That ") ||
    message.startsWith("This ") ||
    message.startsWith("Paste ") ||
    message.startsWith("Lightning addresses") ||
    message.startsWith("Could not reach") ||
    message.startsWith("Invoice ")
  ) {
    return message;
  }
  return "Could not reach that Lightning address.";
}

export function payFailureMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (message === WALLET_LOW || message === PAY_OFFLINE || message === PAY_SLOW) {
    return message;
  }
  if (
    /insufficient|not enough|no funds|balance|empty wallet|amount exceeds|overdraw/i.test(
      message,
    )
  ) {
    return WALLET_LOW;
  }
  if (message === HOST_PAGE || /invalid JSON|too much data/i.test(message)) {
    return PAY_OFFLINE;
  }
  if (/timed out|timeout|did not answer/i.test(message)) {
    return PAY_SLOW;
  }
  if (
    message.startsWith("The ") ||
    message.startsWith("Payment ") ||
    message.startsWith("LNbits ") ||
    message.startsWith("Wallet ")
  ) {
    return message;
  }
  return "Lightning payment failed.";
}

export function lightningHostPage(): string {
  return HOST_PAGE;
}
