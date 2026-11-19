import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BLOCKED_COUNTRIES, GEO_BLOCKED_MESSAGE, isBlockedCountry } from "./geo-block.ts";

describe("isBlockedCountry", () => {
  it("blocks Russia and North Korea by default", () => {
    assert.equal(isBlockedCountry("RU"), true);
    assert.equal(isBlockedCountry("KP"), true);
  });

  it("ignores case and surrounding spaces", () => {
    assert.equal(isBlockedCountry("ru"), true);
    assert.equal(isBlockedCountry("  kp "), true);
  });

  it("allows other countries", () => {
    assert.equal(isBlockedCountry("SE"), false);
    assert.equal(isBlockedCountry("US"), false);
    assert.equal(isBlockedCountry("IN"), false);
  });

  it("allows a missing or malformed code, so local dev still works", () => {
    assert.equal(isBlockedCountry(undefined), false);
    assert.equal(isBlockedCountry(null), false);
    assert.equal(isBlockedCountry(""), false);
    assert.equal(isBlockedCountry("RUS"), false);
    assert.equal(isBlockedCountry("R"), false);
  });

  it("uses a custom list when given one", () => {
    const custom = new Set(["SE"]);
    assert.equal(isBlockedCountry("SE", custom), true);
    assert.equal(isBlockedCountry("RU", custom), false);
  });

  it("keeps every default entry as a two-letter upper-case code", () => {
    for (const code of BLOCKED_COUNTRIES) {
      assert.match(code, /^[A-Z]{2}$/);
    }
  });

  it("has a non-empty message for blocked visitors", () => {
    assert.ok(GEO_BLOCKED_MESSAGE.length > 0);
  });
});
