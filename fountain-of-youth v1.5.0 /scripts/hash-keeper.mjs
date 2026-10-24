#!/usr/bin/env node
/**
 * Print the SHA-256 keeper hash for a phrase.
 * Usage: node scripts/hash-keeper.mjs "your phrase"
 * Put the hex into KEEPER_HASH. Never commit the phrase or the hash.
 */
import { createHash } from "node:crypto";

const phrase = process.argv.slice(2).join(" ").trim();
if (!phrase) {
  console.error('usage: node scripts/hash-keeper.mjs "your phrase"');
  process.exit(1);
}
console.log(createHash("sha256").update(`fountain:${phrase}`).digest("hex"));
