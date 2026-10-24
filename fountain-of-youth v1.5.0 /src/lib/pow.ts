export const POW_DIFFICULTY = 19;
export const POW_TTL_MS = 120_000;

export function powPayload(id: string, nonce: number): string {
  return `${id}:${nonce}`;
}

export function leadingZeroBits(bytes: Uint8Array): number {
  let bits = 0;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]!;
    if (byte === 0) {
      bits += 8;
      continue;
    }
    for (let b = 7; b >= 0; b--) {
      if ((byte >> b) & 1) return bits;
      bits += 1;
    }
  }
  return bits;
}
