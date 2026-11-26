import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  XMAS_MAX_SATS,
  isXmasDay,
  isXmasSeason,
  xmasInvitesToNext,
  xmasNightsLeft,
  xmasPaidRun,
  xmasProgress,
  xmasRefillSats,
} from "./faucet.ts";

describe("Winter Lights window", () => {
  it("runs 1 to 25 December, UTC, both ends included", () => {
    assert.equal(isXmasDay("2026-11-30"), false);
    assert.equal(isXmasDay("2026-12-01"), true);
    assert.equal(isXmasDay("2026-12-25"), true);
    assert.equal(isXmasDay("2026-12-26"), false);
  });

  it("opens at 00:00 UTC on 1 December and closes at 00:00 UTC on 26 December", () => {
    assert.equal(isXmasSeason(new Date("2026-11-30T23:59:59Z")), false);
    assert.equal(isXmasSeason(new Date("2026-12-01T00:00:00Z")), true);
    assert.equal(isXmasSeason(new Date("2026-12-25T23:59:59Z")), true);
    assert.equal(isXmasSeason(new Date("2026-12-26T00:00:00Z")), false);
  });

  it("counts whole nights left", () => {
    assert.equal(xmasNightsLeft(new Date("2026-12-01T00:00:00Z")), 25);
    assert.equal(xmasNightsLeft(new Date("2026-12-25T12:00:00Z")), 1);
    assert.equal(xmasNightsLeft(new Date("2026-12-27T00:00:00Z")), 0);
  });
});

describe("candle run", () => {
  it("needs three paid days in a row inside the window", () => {
    assert.equal(xmasPaidRun(["2026-12-03", "2026-12-04", "2026-12-05"]), 3);
    assert.equal(xmasPaidRun(["2026-12-03", "2026-12-05", "2026-12-07"]), 1);
  });

  it("does not count days before the event", () => {
    assert.equal(xmasPaidRun(["2026-11-29", "2026-11-30", "2026-12-01"]), 1);
    assert.equal(xmasPaidRun(["2026-11-30", "2026-12-01", "2026-12-02"]), 2);
  });

  it("does not count days after the event", () => {
    assert.equal(xmasPaidRun(["2026-12-24", "2026-12-25", "2026-12-26"]), 2);
  });

  it("ignores duplicates and order", () => {
    assert.equal(
      xmasPaidRun(["2026-12-05", "2026-12-03", "2026-12-04", "2026-12-04"]),
      3,
    );
  });

  it("shows live progress, and a broken run is zero", () => {
    const days = ["2026-12-03", "2026-12-04"];
    assert.equal(xmasProgress(days, "2026-12-04"), 2);
    assert.equal(xmasProgress(days, "2026-12-05"), 2);
    assert.equal(xmasProgress(days, "2026-12-06"), 0);
    assert.equal(xmasProgress([], "2026-12-06"), 0);
  });
});

describe("refill meter", () => {
  it("starts at the floor and never goes below it", () => {
    assert.equal(xmasRefillSats(0), 10_000);
    assert.equal(xmasRefillSats(9), 10_000);
    assert.equal(xmasRefillSats(-5), 10_000);
  });

  it("adds 3,000 for every ten invites", () => {
    assert.equal(xmasRefillSats(10), 13_000);
    assert.equal(xmasRefillSats(19), 13_000);
    assert.equal(xmasRefillSats(20), 16_000);
    assert.equal(xmasRefillSats(199), 67_000);
  });

  it("stops at 70,000", () => {
    assert.equal(xmasRefillSats(200), XMAS_MAX_SATS);
    assert.equal(xmasRefillSats(5_000), XMAS_MAX_SATS);
    assert.equal(XMAS_MAX_SATS, 70_000);
  });

  it("says how many invites reach the next stage", () => {
    assert.equal(xmasInvitesToNext(0), 10);
    assert.equal(xmasInvitesToNext(3), 7);
    assert.equal(xmasInvitesToNext(10), 10);
    assert.equal(xmasInvitesToNext(199), 1);
    assert.equal(xmasInvitesToNext(200), null);
  });
});
