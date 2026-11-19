import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MIN_CLAIM_SATS,
  dailyPourBudget,
  dayHasRoom,
  dayOrdinaryRoom,
  fitOrdinaryPour,
  rollPour,
} from "./faucet.ts";

describe("daily ordinary room", () => {
  it("has no limit while the 30% day is off (small pot)", () => {
    assert.equal(dayOrdinaryRoom(500, 0, 0), Number.POSITIVE_INFINITY);
    assert.equal(dayHasRoom(dayOrdinaryRoom(500, 0, 0)), true);
  });

  it("starts at the full daily budget", () => {
    assert.equal(dayOrdinaryRoom(10_000, 0, 0), dailyPourBudget(10_000));
  });

  it("counts jackpots in the pot but not against the ordinary room", () => {
    // 7,000 left in the pot, 3,000 already paid today, 2,000 of it ordinary.
    const budget = dailyPourBudget(7_000 + 3_000);
    assert.equal(dayOrdinaryRoom(7_000, 3_000, 2_000), budget - 2_000);
  });

  it("never goes negative", () => {
    assert.equal(dayOrdinaryRoom(10_000, 5_000, 99_999), 0);
  });

  it("closes the day when less than one minimum pour is left", () => {
    assert.equal(dayHasRoom(MIN_CLAIM_SATS - 1), false);
    assert.equal(dayHasRoom(MIN_CLAIM_SATS), true);
    assert.equal(dayHasRoom(0), false);
  });
});

describe("fitOrdinaryPour", () => {
  it("leaves a pour that fits alone", () => {
    assert.equal(fitOrdinaryPour(50, 500), 50);
  });

  it("shrinks a pour to the room left", () => {
    assert.equal(fitOrdinaryPour(300, 120), 120);
  });

  it("never refuses an ordinary pour while the day is open", () => {
    // The old bug: with 21 <= room < a typical pour, the pour was refused and
    // only a jackpot could succeed. Now every open-day roll pays at least the
    // minimum.
    for (let room = MIN_CLAIM_SATS; room <= 400; room++) {
      for (let amount = MIN_CLAIM_SATS; amount <= 1_500; amount += 7) {
        const fitted = fitOrdinaryPour(amount, room);
        assert.ok(fitted >= MIN_CLAIM_SATS, `room ${room}, amount ${amount}`);
        assert.ok(fitted <= room, `room ${room}, amount ${amount}`);
        assert.ok(fitted <= amount, `room ${room}, amount ${amount}`);
      }
    }
  });

  it("is unchanged while the 30% day is off", () => {
    assert.equal(fitOrdinaryPour(777, dayOrdinaryRoom(500, 0, 0)), 777);
  });
});

describe("end of day is not a jackpot window", () => {
  it("every real roll fits into any open room", () => {
    for (const pot of [1_000, 5_000, 50_000, 500_000]) {
      for (let room = MIN_CLAIM_SATS; room <= 300; room += 13) {
        for (let i = 0; i < 200; i++) {
          const roll = rollPour(pot, 0, false, false);
          const fitted = fitOrdinaryPour(roll.amount, room);
          assert.ok(fitted >= MIN_CLAIM_SATS && fitted <= room);
        }
      }
    }
  });
});
