import { POW_DIFFICULTY, leadingZeroBits, powPayload } from "@/lib/pow";

export class PowCancelled extends Error {
  constructor() {
    super("Cancelled");
    this.name = "PowCancelled";
  }
}

/** Rough number of hashes an average device needs to try at this difficulty. */
export function powEstimatedAttempts(difficulty = POW_DIFFICULTY): number {
  return 2 ** difficulty;
}

export async function solvePow(
  id: string,
  difficulty = POW_DIFFICULTY,
  options?: { onProgress?: (nonce: number) => void; signal?: AbortSignal },
): Promise<number> {
  const enc = new TextEncoder();
  for (let nonce = 0; nonce <= 40_000_000; nonce++) {
    if (options?.signal?.aborted) throw new PowCancelled();
    const digest = await crypto.subtle.digest(
      "SHA-256",
      enc.encode(powPayload(id, nonce)),
    );
    if (leadingZeroBits(new Uint8Array(digest)) >= difficulty) return nonce;
    if (nonce % 2500 === 0) {
      options?.onProgress?.(nonce);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  throw new Error("Could not solve the spring puzzle. Try again.");
}
