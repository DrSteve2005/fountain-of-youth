import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyStreakDrink,
  boostNormalPour,
  dailyPourBudget,
  dailyCapApplies,
  farmPuzzleBits,
  FARM_ADDRESS_CAP,
  freshDayBudget,
  dayInFreeze,
  jackpotChance,
  liveStreak,
  streakBoardSince,
  trustedLastDrink,
  isHallowSeason,
  hallowPaidRun,
  hallowProgress,
  hallowStreakEarned,
  refillMoment,
  openDaysMissed,
  payoutBoostPct,
  pourSchedule,
  shouldBackfillGrace,
  withDryFreeze,
  type StreakFreeze,
} from "./faucet.ts";

function noon(day: string): Date {
  return new Date(`${day}T12:00:00.000Z`);
}

describe("applyStreakDrink", () => {
  it("starts at 1 with no token", () => {
    const next = applyStreakDrink(0, null, false, noon("2026-09-01"));
    assert.deepEqual(next, {
      streak: 1,
      graceToken: false,
      usedGrace: false,
      earnedGrace: false,
    });
  });

  it("earns a grace day on the 7th consecutive drink", () => {
    const next = applyStreakDrink(6, "2026-09-06", false, noon("2026-09-07"));
    assert.equal(next.streak, 7);
    assert.equal(next.graceToken, true);
    assert.equal(next.usedGrace, false);
    assert.equal(next.earnedGrace, true);
  });

  it("spends the token on a single missed day and keeps the streak", () => {
    const next = applyStreakDrink(7, "2026-09-07", true, noon("2026-09-09"));
    assert.equal(openDaysMissed("2026-09-07", noon("2026-09-09")), 1);
    assert.equal(next.streak, 8);
    assert.equal(next.usedGrace, true);
    assert.equal(next.graceToken, false);
    assert.equal(next.earnedGrace, false);
  });

  it("wipes the streak after two missed days even with a token", () => {
    const next = applyStreakDrink(7, "2026-09-07", true, noon("2026-09-10"));
    assert.equal(next.streak, 1);
    assert.equal(next.graceToken, false);
    assert.equal(next.usedGrace, false);
    assert.equal(next.earnedGrace, false);
  });

  it("re-earns a token at 14 after spending one", () => {
    const next = applyStreakDrink(13, "2026-09-13", false, noon("2026-09-14"));
    assert.equal(next.streak, 14);
    assert.equal(next.earnedGrace, true);
    assert.equal(next.graceToken, true);
  });

  it("does not stack a second token if one is already held at a milestone", () => {
    const next = applyStreakDrink(13, "2026-09-13", true, noon("2026-09-14"));
    assert.equal(next.streak, 14);
    assert.equal(next.graceToken, true);
    assert.equal(next.earnedGrace, false);
  });

  it("spends then immediately re-earns when a miss lands on a milestone", () => {
    const next = applyStreakDrink(13, "2026-09-13", true, noon("2026-09-15"));
    assert.equal(next.streak, 14);
    assert.equal(next.usedGrace, true);
    assert.equal(next.earnedGrace, true);
    assert.equal(next.graceToken, true);
  });
});

describe("liveStreak with grace", () => {
  it("still shows yesterday's streak today before you drink", () => {
    assert.equal(liveStreak(7, "2026-09-07", noon("2026-09-08"), null, false), 7);
  });

  it("keeps the streak for one open miss if a token is held", () => {
    assert.equal(liveStreak(7, "2026-09-07", noon("2026-09-09"), null, true), 7);
  });

  it("zeros after one miss without a token", () => {
    assert.equal(liveStreak(7, "2026-09-07", noon("2026-09-09"), null, false), 0);
  });

  it("zeros after two misses even with a token", () => {
    assert.equal(liveStreak(7, "2026-09-07", noon("2026-09-10"), null, true), 0);
  });
});

describe("trustedLastDrink", () => {
  it("does not let a dry-day press revive a streak that already died", () => {
    const anchor = trustedLastDrink("2026-10-13", "2026-09-01");
    assert.equal(anchor, "2026-09-01");
    assert.equal(liveStreak(4, anchor, noon("2026-10-13")), 0);
    assert.equal(
      applyStreakDrink(4, anchor, false, noon("2026-10-13")).streak,
      1,
    );
  });

  it("keeps a hold when the last paid pour was yesterday", () => {
    assert.equal(trustedLastDrink("2026-10-13", "2026-10-12"), "2026-10-13");
  });

  it("keeps a hold across a dry spell when the streak was still alive", () => {
    const freeze = withDryFreeze(null, null, [
      { from: "2026-09-02", until: "2026-10-12" },
    ]);
    const anchor = trustedLastDrink("2026-10-12", "2026-09-01", freeze);
    assert.equal(anchor, "2026-10-12");
    assert.equal(liveStreak(4, anchor, noon("2026-10-13"), freeze), 4);
  });

  it("drops a hold when open days were missed before the well went dry", () => {
    const freeze = withDryFreeze(null, null, [
      { from: "2026-09-10", until: "2026-10-12" },
    ]);
    const anchor = trustedLastDrink("2026-10-12", "2026-09-01", freeze);
    assert.equal(anchor, "2026-09-01");
    assert.equal(liveStreak(4, anchor, noon("2026-10-13"), freeze), 0);
  });
});

describe("the Haunting", () => {
  it("is open for every UTC day in October and closed on 1 November", () => {
    assert.equal(isHallowSeason(new Date("2026-10-01T00:00:00.000Z")), true);
    assert.equal(isHallowSeason(new Date("2026-10-31T23:00:00.000Z")), true);
    assert.equal(isHallowSeason(new Date("2026-11-01T00:00:00.000Z")), false);
    assert.equal(isHallowSeason(new Date("2026-09-30T23:00:00.000Z")), false);
  });

  it("counts down to the 31 October refill and then leaves", () => {
    assert.equal(refillMoment(new Date("2026-10-16T20:00:00.000Z")).phase, "wait");
    assert.equal(refillMoment(new Date("2026-10-31T00:00:00.000Z")).phase, "wait");
    assert.equal(refillMoment(new Date("2026-10-31T18:59:00.000Z")).phase, "wait");
    assert.equal(refillMoment(new Date("2026-10-31T19:00:00.000Z")).phase, "today");
    assert.equal(refillMoment(new Date("2026-10-31T22:00:00.000Z")).phase, "today");
    assert.equal(refillMoment(new Date("2026-10-31T23:00:00.000Z")).phase, "gone");
  });

  it("ignores a streak from before October", () => {
    const before = ["2026-09-28", "2026-09-29", "2026-09-30"];
    assert.equal(hallowPaidRun(before), 0);
    assert.equal(hallowPaidRun([...before, "2026-10-01"]), 1);
    assert.equal(hallowPaidRun(["2026-10-01", "2026-10-02", "2026-10-03"]), 3);
    assert.equal(hallowPaidRun(["2026-10-01", "2026-10-03", "2026-10-04"]), 2);
    assert.equal(hallowProgress(["2026-10-18", "2026-10-19"], "2026-10-20"), 2);
    assert.equal(hallowProgress(["2026-10-01"], "2026-10-20"), 0);
    assert.equal(hallowStreakEarned(3, "2026-10-20"), true);
    assert.equal(hallowStreakEarned(3, "2026-10-02"), false);
    assert.equal(hallowStreakEarned(2, "2026-10-20"), false);
  });
});

describe("farm pressure", () => {
  it("leaves a returning address and a first visit on the normal puzzle", () => {
    assert.equal(farmPuzzleBits(19, 5, false), 19);
    assert.equal(farmPuzzleBits(19, 0, true), 19);
  });

  it("adds bits for each extra new name, then stops at 22", () => {
    assert.equal(farmPuzzleBits(19, 1, true), 20);
    assert.equal(farmPuzzleBits(19, 2, true), 21);
    assert.equal(farmPuzzleBits(19, 3, true), 22);
    assert.equal(farmPuzzleBits(19, 9, true), 22);
    assert.equal(FARM_ADDRESS_CAP, 2);
  });

  it("keeps a third of the day for first drinks", () => {
    assert.equal(freshDayBudget(90_000), 30_000);
    assert.equal(freshDayBudget(6_000), 2_000);
    assert.equal(freshDayBudget(300), 100);
  });
});

describe("streak board window", () => {
  it("includes a day-one drink and one grace miss", () => {
    assert.equal(streakBoardSince(noon("2026-09-10")), "2026-09-07");
    assert.equal(liveStreak(1, "2026-09-10", noon("2026-09-10"), null, false), 1);
  });

  it("skips frozen days so a live streak is still inside the window", () => {
    const freeze: StreakFreeze = { from: "2026-09-08", until: "2026-09-09" };
    const since = streakBoardSince(noon("2026-09-10"), freeze);
    assert.ok(since <= "2026-09-07");
    assert.equal(liveStreak(7, "2026-09-07", noon("2026-09-10"), freeze, false), 7);
  });
});

describe("streak freeze", () => {
  it("does not count frozen UTC days as a miss", () => {
    const freeze: StreakFreeze = { from: "2026-09-08", until: "2026-09-09" };
    assert.equal(openDaysMissed("2026-09-07", noon("2026-09-10"), freeze), 0);
    assert.equal(
      liveStreak(7, "2026-09-07", noon("2026-09-10"), freeze, false),
      7,
    );
  });

  it("uses the simulated now when the window is still open", () => {
    const freeze: StreakFreeze = { from: "2026-09-08", until: null };
    assert.equal(dayInFreeze("2026-09-09", freeze, noon("2026-09-10")), true);
    assert.equal(openDaysMissed("2026-09-07", noon("2026-09-10"), freeze), 0);
    assert.equal(
      liveStreak(12, "2026-09-07", noon("2026-09-10"), freeze, false),
      12,
    );
  });

  it("continues the streak on the first open day after freeze, without spending grace", () => {
    const freeze: StreakFreeze = { from: "2026-09-08", until: "2026-09-09" };
    const next = applyStreakDrink(
      7,
      "2026-09-07",
      true,
      noon("2026-09-10"),
      freeze,
    );
    assert.equal(next.streak, 8);
    assert.equal(next.usedGrace, false);
    assert.equal(next.graceToken, true);
  });

  it("does not spend grace while the well is frozen", () => {
    const freeze: StreakFreeze = { from: "2026-09-08", until: "2026-09-12" };
    const next = applyStreakDrink(
      9,
      "2026-09-07",
      true,
      noon("2026-09-13"),
      freeze,
    );
    assert.equal(openDaysMissed("2026-09-07", noon("2026-09-13"), freeze), 0);
    assert.equal(next.usedGrace, false);
    assert.equal(next.graceToken, true);
    assert.equal(next.streak, 10);
  });

  it("counts an open gap between two freeze windows as a miss", () => {
    const freeze: StreakFreeze = {
      from: "2026-09-10",
      until: "2026-09-11",
      ranges: [{ from: "2026-09-08", until: "2026-09-08" }],
    };
    // drank 7th, freeze 8th, open 9th, freeze 10-11, today 12th → missed the 9th
    assert.equal(openDaysMissed("2026-09-07", noon("2026-09-12"), freeze), 1);
    assert.equal(
      liveStreak(7, "2026-09-07", noon("2026-09-12"), freeze, true),
      7,
    );
    assert.equal(
      liveStreak(7, "2026-09-07", noon("2026-09-12"), freeze, false),
      0,
    );
    const next = applyStreakDrink(
      7,
      "2026-09-07",
      true,
      noon("2026-09-12"),
      freeze,
    );
    assert.equal(next.streak, 8);
    assert.equal(next.usedGrace, true);
  });

  it("wipes the streak if the open gap is two days even with two freeze windows", () => {
    const freeze: StreakFreeze = {
      from: "2026-09-12",
      until: "2026-09-12",
      ranges: [{ from: "2026-09-08", until: "2026-09-08" }],
    };
    // drank 7th, freeze 8, open 9 and 10, freeze 12, today 13 → missed 9, 10, 11
    assert.ok(openDaysMissed("2026-09-07", noon("2026-09-13"), freeze) >= 2);
    const next = applyStreakDrink(
      7,
      "2026-09-07",
      true,
      noon("2026-09-13"),
      freeze,
    );
    assert.equal(next.streak, 1);
    assert.equal(next.graceToken, false);
  });
});

describe("shouldBackfillGrace", () => {
  it("grants to a live 7-day streak", () => {
    assert.equal(
      shouldBackfillGrace(7, "2026-09-07", noon("2026-09-07")),
      true,
    );
    assert.equal(
      shouldBackfillGrace(7, "2026-09-07", noon("2026-09-08")),
      true,
    );
  });

  it("grants to a 7-day streak that missed one open day (the token would save them)", () => {
    assert.equal(
      shouldBackfillGrace(7, "2026-09-07", noon("2026-09-09")),
      true,
    );
  });

  it("does not grant a dead streak", () => {
    assert.equal(
      shouldBackfillGrace(12, "2026-09-01", noon("2026-09-10")),
      false,
    );
  });

  it("does not grant under 7 days", () => {
    assert.equal(
      shouldBackfillGrace(6, "2026-09-07", noon("2026-09-07")),
      false,
    );
  });

  it("grants through a freeze window", () => {
    const freeze: StreakFreeze = { from: "2026-09-08", until: "2026-09-09" };
    assert.equal(
      shouldBackfillGrace(11, "2026-09-07", noon("2026-09-10"), freeze),
      true,
    );
  });
});

describe("dry freeze", () => {
  it("does not count empty-pot days as a miss if you never show up", () => {
    const freeze = withDryFreeze(null, "2026-09-02", []);
    assert.equal(openDaysMissed("2026-09-01", noon("2026-09-05"), freeze), 0);
    assert.equal(
      liveStreak(4, "2026-09-01", noon("2026-09-05"), freeze, false),
      4,
    );
  });

  it("continues the streak on the first paid drink after a dry spell", () => {
    const freeze = withDryFreeze(null, null, [
      { from: "2026-09-02", until: "2026-09-04" },
    ]);
    const next = applyStreakDrink(
      4,
      "2026-09-01",
      false,
      noon("2026-09-05"),
      freeze,
    );
    assert.equal(next.streak, 5);
    assert.equal(next.usedGrace, false);
    assert.equal(next.graceToken, false);
  });

  it("still wipes if you skip a wet day after the refill", () => {
    const freeze = withDryFreeze(null, null, [
      { from: "2026-09-02", until: "2026-09-03" },
    ]);
    assert.equal(openDaysMissed("2026-09-01", noon("2026-09-05"), freeze), 1);
    const next = applyStreakDrink(
      4,
      "2026-09-01",
      false,
      noon("2026-09-05"),
      freeze,
    );
    assert.equal(next.streak, 1);
  });

  it("keeps a grace token unspent across a dry spell", () => {
    const freeze = withDryFreeze(null, "2026-09-08", []);
    const next = applyStreakDrink(
      7,
      "2026-09-07",
      true,
      noon("2026-09-10"),
      freeze,
    );
    assert.equal(next.streak, 8);
    assert.equal(next.usedGrace, false);
    assert.equal(next.graceToken, true);
  });

  it("stacks with a maintenance freeze", () => {
    const freeze = withDryFreeze(
      { from: "2026-09-03", until: "2026-09-03" },
      null,
      [{ from: "2026-09-02", until: "2026-09-02" }],
    );
    assert.equal(openDaysMissed("2026-09-01", noon("2026-09-05"), freeze), 1);
  });
});

describe("streak sip boost", () => {
  it("adds 1% per streak day and caps at 25%", () => {
    assert.equal(payoutBoostPct(0), 0);
    assert.equal(payoutBoostPct(1), 1);
    assert.equal(payoutBoostPct(7), 7);
    assert.equal(payoutBoostPct(25), 25);
    assert.equal(payoutBoostPct(40), 25);
  });

  it("lifts a normal sip but never past the payable ceiling", () => {
    assert.equal(boostNormalPour(200, 7, 10_000), 214);
    assert.equal(boostNormalPour(200, 25, 10_000), 250);
    assert.equal(boostNormalPour(200, 25, 210), 210);
  });

  it("does not shrink a floor sip", () => {
    assert.equal(boostNormalPour(21, 0, 10_000), 21);
  });
});

describe("pour schedule", () => {
  function band(
    pot: number,
    tier: "jackpot" | "rare" | "uncommon" | "common",
  ) {
    return pourSchedule(pot).find((b) => b.tier === tier)!;
  }

  it("grows the jackpot with the pot, at 10%", () => {
    assert.equal(band(10_000, "jackpot").min, 1_000);
    assert.equal(band(100_000, "jackpot").min, 10_000);
    assert.equal(band(1_000_000, "jackpot").min, 100_000);
  });

  it("grows ordinary sips as the pot grows", () => {
    const pots = [10_000, 50_000, 100_000, 1_000_000];
    for (const tier of ["common", "uncommon", "rare"] as const) {
      const maxes = pots.map((pot) => band(pot, tier).max);
      for (let i = 1; i < maxes.length; i += 1) {
        assert.ok(maxes[i]! > maxes[i - 1]!, `${tier} ${pots[i]}`);
      }
    }
  });

  it("keeps the jackpot clearly above a normal pour", () => {
    for (const pot of [10_000, 50_000, 100_000, 1_000_000]) {
      const jackpot = band(pot, "jackpot").min;
      assert.ok(jackpot >= band(pot, "rare").max * 2, String(pot));
    }
  });

  it("keeps ordinary sips below the jackpot", () => {
    for (const pot of [500, 2_100, 10_000, 50_000, 100_000, 1_000_000]) {
      const bands = pourSchedule(pot);
      const jackpot = bands[0]!.min;
      for (const b of bands.filter((t) => t.tier !== "jackpot")) {
        assert.ok(b.min >= 21, `${pot} ${b.tier} min`);
        assert.ok(b.min <= b.max, `${pot} ${b.tier} order`);
        assert.ok(b.max < jackpot, `${pot} ${b.tier} below jackpot`);
      }
    }
  });

  it("spends about 30% of the pot in a day", () => {
    assert.equal(dailyPourBudget(10_000), 3_000);
    assert.equal(dailyPourBudget(100_000), 30_000);
    assert.equal(dailyPourBudget(1_000_000), 300_000);
    assert.equal(dailyCapApplies(999), false);
    assert.equal(dailyCapApplies(1_000), true);
  });

  it("makes a huge jackpot rarer than a small one", () => {
    assert.ok(jackpotChance(0, 10_000) > jackpotChance(0, 100_000));
    assert.ok(jackpotChance(0, 100_000) > jackpotChance(0, 1_000_000));
    assert.ok(jackpotChance(0, 1_000_000) >= 0.002);
    assert.ok(jackpotChance(50, 10_000) <= 0.05);
    assert.ok(jackpotChance(50, 1_000_000) <= jackpotChance(0, 1_000_000) * 1.5);
  });
});
