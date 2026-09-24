import * as assert from "assert";
import { Poll, castVote, createPoll, isOpen, sortPolls, tally } from "./polls.js";

const T0 = 1_000_000;
const MIN = 60_000;

const make = (name = "lunch", options = ["pizza", "tacos"], minutes = 10, now = T0): Poll => {
  const r = createPoll(name, options, minutes, now);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

const vote = (p: Poll, voter: string, option: string, now = T0): Poll => {
  const r = castVote(p, voter, option, now);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe("createPoll", () => {
  it("creates a poll that ends after the given minutes", () => {
    const p = make();
    assert.strictEqual(p.endTime, T0 + 10 * MIN);
    assert.deepStrictEqual(p.options, ["pizza", "tacos"]);
    assert.deepStrictEqual(p.votes, []);
  });

  it("trims and drops blank options", () => {
    assert.deepStrictEqual(make("x", [" a ", "", "b"]).options, ["a", "b"]);
  });

  it("rejects invalid input", () => {
    assert.strictEqual(createPoll("", ["a", "b"], 5, T0).ok, false);
    assert.strictEqual(createPoll("x", ["a"], 5, T0).ok, false);
    assert.strictEqual(createPoll("x", ["a", "a"], 5, T0).ok, false);
    assert.strictEqual(createPoll("x", ["a", "b"], 0, T0).ok, false);
    assert.strictEqual(createPoll("x", ["a", "b"], 1.5, T0).ok, false);
  });
});

describe("castVote", () => {
  it("adds a vote without mutating the original poll", () => {
    const p0 = make();
    const p1 = vote(p0, "kevin", "pizza");
    assert.deepStrictEqual(p0.votes, []);
    assert.deepStrictEqual(p1.votes, [{ voter: "kevin", option: "pizza" }]);
    assert.notStrictEqual(p0, p1);
  });

  it("replaces an earlier vote by the same voter", () => {
    const p = vote(vote(make(), "kevin", "pizza"), "kevin", "tacos");
    assert.deepStrictEqual(p.votes, [{ voter: "kevin", option: "tacos" }]);
  });

  it("rejects unknown options, blank voters, and closed polls", () => {
    const p = make();
    assert.strictEqual(castVote(p, "kevin", "sushi", T0).ok, false);
    assert.strictEqual(castVote(p, "  ", "pizza", T0).ok, false);
    assert.strictEqual(castVote(p, "kevin", "pizza", T0 + 10 * MIN).ok, false);
  });
});

describe("isOpen", () => {
  it("is open strictly before endTime", () => {
    const p = make();
    assert.ok(isOpen(p, T0 + 10 * MIN - 1));
    assert.ok(!isOpen(p, T0 + 10 * MIN));
  });
});

describe("tally", () => {
  it("returns zeros for a poll with no votes", () => {
    assert.deepStrictEqual(tally(make()), [
      { option: "pizza", count: 0, percent: 0 },
      { option: "tacos", count: 0, percent: 0 },
    ]);
  });

  it("counts votes and computes percentages", () => {
    let p = make("x", ["a", "b", "c"]);
    p = vote(p, "u1", "a");
    p = vote(p, "u2", "a");
    p = vote(p, "u3", "b");
    assert.deepStrictEqual(tally(p), [
      { option: "a", count: 2, percent: 67 },
      { option: "b", count: 1, percent: 33 },
      { option: "c", count: 0, percent: 0 },
    ]);
  });
});

describe("sortPolls", () => {
  it("lists open polls (soonest first) before closed polls (latest first)", () => {
    const polls = [make("closed-old", undefined, 1, T0 - 100 * MIN), make("open-late", undefined, 30),
      make("closed-new", undefined, 1, T0 - 5 * MIN), make("open-soon", undefined, 5)];
    assert.deepStrictEqual(sortPolls(polls, T0).map((p) => p.name),
      ["open-soon", "open-late", "closed-new", "closed-old"]);
  });

  it("returns an empty array for no polls", () => {
    assert.deepStrictEqual(sortPolls([], T0), []);
  });
});
