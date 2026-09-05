import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { circularPairs, scoreMatchup, bigBitePoints, randomCode, type Ballot } from "../engine";

describe("circularPairs", () => {
  it("gives every player exactly two prompts against two different neighbours", () => {
    const ids = ["a", "b", "c", "d", "e"];
    const pairs = circularPairs(ids);
    assert.equal(pairs.length, 5);
    for (const id of ids) {
      const mine = pairs.filter((p) => p.a === id || p.b === id);
      assert.equal(mine.length, 2, `${id} should be in two matchups`);
      const opponents = mine.map((p) => (p.a === id ? p.b : p.a));
      assert.notEqual(opponents[0], opponents[1]);
    }
  });

  it("with two players, both share both prompts", () => {
    const pairs = circularPairs(["a", "b"]);
    assert.deepEqual(pairs, [
      { a: "a", b: "b" },
      { a: "b", b: "a" },
    ]);
  });
});

describe("scoreMatchup", () => {
  const ballot = (voterId: string, isPlayer: boolean, choice: string): Ballot => ({ voterId, isPlayer, choice });

  it("splits base points proportionally and awards sweep + audience bonuses in round 1", () => {
    const res = scoreMatchup("a", "b", [ballot("p1", true, "a"), ballot("p2", true, "a"), ballot("x1", false, "a"), ballot("x2", false, "b")], 1);
    assert.equal(res.votes.a, 3);
    assert.equal(res.votes.b, 1);
    assert.equal(res.basePoints.a, 750);
    assert.equal(res.basePoints.b, 250);
    assert.equal(res.sweep, "a");
    assert.equal(res.audienceFav, null); // 1–1 audience tie
    assert.equal(res.totalPoints.a, 750 + 500);
    assert.equal(res.totalPoints.b, 250);
    assert.equal(res.winner, "a");
  });

  it("doubles everything in round 2", () => {
    const res = scoreMatchup("a", "b", [ballot("p1", true, "b"), ballot("x1", false, "b")], 2);
    assert.equal(res.basePoints.b, 2000);
    assert.equal(res.sweep, "b");
    assert.equal(res.audienceFav, "b");
    assert.equal(res.totalPoints.b, 2000 + 1000 + 200);
    assert.equal(res.totalPoints.a, 0);
  });

  it("does not award a sweep when no active players voted", () => {
    const res = scoreMatchup("a", "b", [ballot("x1", false, "a")], 1);
    assert.equal(res.sweep, null);
    assert.equal(res.audienceFav, "a");
    assert.equal(res.totalPoints.a, 1000 + 100);
  });

  it("splits evenly with no votes and names no winner", () => {
    const res = scoreMatchup("a", "b", [], 1);
    assert.equal(res.basePoints.a, 500);
    assert.equal(res.basePoints.b, 500);
    assert.equal(res.winner, null);
    assert.equal(res.sweep, null);
  });

  it("ignores ballots for players not in the matchup", () => {
    const res = scoreMatchup("a", "b", [ballot("p1", true, "zzz")], 1);
    assert.equal(res.votes.a + res.votes.b, 0);
  });
});

describe("bigBitePoints", () => {
  it("pays 500 per vote", () => {
    assert.equal(bigBitePoints(0), 0);
    assert.equal(bigBitePoints(3), 1500);
  });
});

describe("randomCode", () => {
  it("returns a fresh 4-digit code", () => {
    const taken = new Set(["1234"]);
    for (let i = 0; i < 50; i++) {
      const code = randomCode((c) => taken.has(c));
      assert.match(code, /^\d{4}$/);
      assert.ok(!taken.has(code));
    }
  });
});
