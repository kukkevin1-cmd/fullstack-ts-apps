import * as assert from "assert";
import { nil, cons, fromArray, toArray, len, concat, startsWith } from "./list.js";
import { toWords, swapPronouns, matchPattern, fillTemplate, respond, initialState, ChatState } from "./chatbot.js";
import { PATTERNS } from "./patterns.js";

const words = (s: string) => fromArray(s.split(" "));
const unlist = (L: ReturnType<typeof matchPattern>) =>
  L === undefined ? undefined : toArray(L).map((seg) => toArray(seg));

describe("list", () => {
  it("fromArray / toArray round trip", () => {
    assert.deepStrictEqual(toArray(fromArray([1, 2, 3])), [1, 2, 3]);
    assert.deepStrictEqual(toArray(nil), []);
  });

  it("len and concat", () => {
    assert.strictEqual(len(concat(fromArray([1, 2]), fromArray([3]))), 3);
    assert.strictEqual(len(nil), 0);
  });

  it("concat does not mutate its inputs", () => {
    const L = fromArray([1, 2]);
    const R = cons(3, nil);
    concat(L, R);
    assert.deepStrictEqual(toArray(L), [1, 2]);
    assert.deepStrictEqual(toArray(R), [3]);
  });

  it("startsWith", () => {
    assert.ok(startsWith(fromArray([1, 2]), fromArray([1, 2, 3])));
    assert.ok(startsWith(nil, fromArray([1])));
    assert.ok(!startsWith(fromArray([2]), fromArray([1, 2])));
  });
});

describe("toWords / swapPronouns", () => {
  it("normalizes case and punctuation", () => {
    assert.deepStrictEqual(toArray(toWords("Hello, World!!")), ["hello", "world"]);
    assert.deepStrictEqual(toArray(toWords("   ")), []);
  });

  it("swaps first and second person", () => {
    assert.deepStrictEqual(toArray(swapPronouns(words("i love my dog"))), ["you", "love", "your", "dog"]);
    assert.deepStrictEqual(toArray(swapPronouns(words("you are nice"))), ["I", "are", "nice"]);
  });
});

describe("matchPattern", () => {
  it("matches literal patterns exactly", () => {
    assert.deepStrictEqual(unlist(matchPattern(words("a b"), words("a b"))), []);
    assert.strictEqual(matchPattern(words("a b"), words("a c")), undefined);
    assert.strictEqual(matchPattern(words("a b c"), words("a b")), undefined);
  });

  it("captures wildcard segments (0 or more words)", () => {
    assert.deepStrictEqual(unlist(matchPattern(words("i feel sad"), words(". i feel ."))), [[], ["sad"]]);
    assert.deepStrictEqual(
      unlist(matchPattern(words("well i feel very tired"), words(". i feel ."))),
      [["well"], ["very", "tired"]],
    );
  });

  it("'*' matches without capturing", () => {
    assert.deepStrictEqual(unlist(matchPattern(words("well i feel sad"), words("* i feel ."))), [["sad"]]);
  });

  it("returns undefined when the keyword is missing", () => {
    assert.strictEqual(matchPattern(words("i am sad"), words(". i feel .")), undefined);
  });
});

describe("fillTemplate", () => {
  it("substitutes captures with pronouns swapped", () => {
    const out = fillTemplate(words("tell me about your ."), cons(words("my job"), nil));
    assert.deepStrictEqual(toArray(out), ["tell", "me", "about", "your", "your", "job"]);
  });

  it("leaves templates without slots unchanged", () => {
    assert.deepStrictEqual(toArray(fillTemplate(words("please go on"), nil)), ["please", "go", "on"]);
  });
});

describe("respond", () => {
  it("answers using the first matching pattern", () => {
    const { reply } = respond("I feel tired", initialState, PATTERNS);
    assert.strictEqual(reply, "Why do you feel tired?");
  });

  it("cycles through responses for the same pattern", () => {
    const r1 = respond("I feel tired", initialState, PATTERNS);
    const r2 = respond("I feel tired", r1.state, PATTERNS);
    assert.strictEqual(r2.reply, "How long have you felt tired?");
  });

  it("never mutates the incoming state", () => {
    const before: ChatState = initialState;
    respond("my dog is sick", before, PATTERNS);
    assert.strictEqual(before.lastUsed.size, 0);
    assert.strictEqual(before.memory.kind, "nil");
  });

  it("remembers 'my ...' statements and recalls them later", () => {
    const r1 = respond("my dog is sick", initialState, PATTERNS);
    assert.strictEqual(r1.reply, "You mentioned that your dog is sick -- can you tell me more?");
    const r2 = respond("ok", r1.state, PATTERNS);
    assert.strictEqual(r2.reply, "Earlier you said that your dog is sick.");
    assert.strictEqual(r2.state.memory.kind, "nil");
  });

  it("falls back to a generic prompt", () => {
    assert.strictEqual(respond("hmm", initialState, PATTERNS).reply, "Please go on.");
  });
});
