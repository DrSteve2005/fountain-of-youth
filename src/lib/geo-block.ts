/**
 * Country block for the faucet.
 *
 * The fountain does not pay out to visitors in the countries listed here.
 * Vercel sets the `x-vercel-ip-country` request header (a two-letter ISO 3166-1
 * code) on every request and overwrites any value a client sends, so a visitor
 * cannot spoof it. A VPN can still hide a visitor's real country, so this is a
 * reasonable-steps measure, not a guarantee. Ask a lawyer which countries and
 * regions are required.
 *
 * To change the list, edit BLOCKED_COUNTRIES below. Codes must be upper case.
 */
export const BLOCKED_COUNTRIES: ReadonlySet<string> = new Set([
  "RU", // Russia
  "KP", // North Korea
  // Other places often covered by sanctions. Not blocked until you uncomment
  // them. Confirm the exact list with a lawyer.
  // "IR", // Iran
  // "SY", // Syria
  // "CU", // Cuba
  // "BY", // Belarus
]);

/** Shown to blocked visitors. Deliberately short and not specific. */
export const GEO_BLOCKED_MESSAGE = "The fountain is not available in your region.";

/**
 * True when the country code is on the block list. A missing or unreadable
 * code returns false, so local development (which has no Vercel header) keeps
 * working. On Vercel the header is always present.
 */
export function isBlockedCountry(
  code: string | null | undefined,
  blocked: ReadonlySet<string> = BLOCKED_COUNTRIES,
): boolean {
  const normalized = (code ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return false;
  return blocked.has(normalized);
}
