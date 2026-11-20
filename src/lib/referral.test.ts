import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GUIDE_LEVELS,
  REF_CODE_LENGTH,
  guideTier,
  inviteUrl,
  makeRefCode,
  nextGuideLevel,
  parseRefCode,
} from "./faucet.ts";

describe("guideTier", () => {
  it("has no badge before the first invite", () => {
    assert.equal(guideTier(0), null);
    assert.equal(guideTier(-3), null);
  });

  it("levels up at 1, 3, 10 and 21", () => {
    assert.equal(guideTier(1), "scout");
    assert.equal(guideTier(2), "scout");
    assert.equal(guideTier(3), "guide");
    assert.equal(guideTier(9), "guide");
    assert.equal(guideTier(10), "pathfinder");
    assert.equal(guideTier(20), "pathfinder");
    assert.equal(guideTier(21), "cartographer");
    assert.equal(guideTier(500), "cartographer");
  });

  it("keeps the levels in rising order", () => {
    for (let i = 1; i < GUIDE_LEVELS.length; i += 1) {
      assert.ok(GUIDE_LEVELS[i]!.min > GUIDE_LEVELS[i - 1]!.min);
    }
  });
});

describe("nextGuideLevel", () => {
  it("points at Scout from zero", () => {
    assert.deepEqual(nextGuideLevel(0), { tier: "scout", min: 1, left: 1 });
  });

  it("counts what is left to the next level", () => {
    assert.deepEqual(nextGuideLevel(1), { tier: "guide", min: 3, left: 2 });
    assert.deepEqual(nextGuideLevel(3), { tier: "pathfinder", min: 10, left: 7 });
    assert.deepEqual(nextGuideLevel(20), { tier: "cartographer", min: 21, left: 1 });
  });

  it("is null at the top", () => {
    assert.equal(nextGuideLevel(21), null);
    assert.equal(nextGuideLevel(99), null);
  });
});

describe("invite codes", () => {
  it("makes a code that parses back", () => {
    const bytes = new Uint8Array(REF_CODE_LENGTH).map((_, i) => i * 37 + 11);
    const code = makeRefCode(bytes);
    assert.equal(code.length, REF_CODE_LENGTH);
    assert.equal(parseRefCode(code), code);
  });

  it("never uses look-alike characters", () => {
    for (let b = 0; b < 256; b += 1) {
      const code = makeRefCode(new Uint8Array(REF_CODE_LENGTH).fill(b));
      assert.doesNotMatch(code, /[01ilo]/);
    }
  });

  it("normalises case and spaces", () => {
    assert.equal(parseRefCode("  ABCD2345 "), "abcd2345");
  });

  it("refuses anything that is not a code", () => {
    assert.equal(parseRefCode(undefined), null);
    assert.equal(parseRefCode(""), null);
    assert.equal(parseRefCode("abc"), null);
    assert.equal(parseRefCode("abcd23450"), null);
    assert.equal(parseRefCode("abcd234o"), null);
    assert.equal(parseRefCode("abcd'; --"), null);
    assert.equal(parseRefCode("you@wallet.com"), null);
  });

  it("builds the link on the real domain", () => {
    assert.equal(
      inviteUrl("abcd2345"),
      "https://getfountainofyouth.net/?ref=abcd2345",
    );
    assert.equal(
      inviteUrl("abcd2345", "http://localhost:8080/"),
      "http://localhost:8080/?ref=abcd2345",
    );
  });
});
