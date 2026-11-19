import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LEGACY_LIMIT } from "./faucet.ts";

describe("Legacy badge", () => {
  it("stays closed: no new Legacy badges are awarded", () => {
    assert.equal(LEGACY_LIMIT, 0);
  });
});
