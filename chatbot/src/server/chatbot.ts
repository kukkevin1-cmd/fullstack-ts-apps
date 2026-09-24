import { List, nil, cons, fromArray, toArray, concat, map } from "./list.js";

/**
 * A pattern is a sequence of words, where "." matches (and captures) zero or
 * more words, and "*" matches zero or more words without capturing them.
 * A response template uses "." to insert the next captured segment.
 */
export type Pattern = {
  readonly name: string;
  readonly contents: ReadonlyArray<string>;
  readonly responses: ReadonlyArray<ReadonlyArray<string>>;
};

/** All chatbot state is immutable; `respond` returns the next state. */
export type ChatState = {
  readonly lastUsed: ReadonlyMap<string, number>;
  readonly memory: List<List<string>>;
};

export const initialState: ChatState = { lastUsed: new Map(), memory: nil };

const PRONOUNS: ReadonlyMap<string, string> = new Map([
  ["i", "you"], ["me", "you"], ["my", "your"], ["am", "are"], ["mine", "yours"],
  ["you", "I"], ["your", "my"], ["yours", "mine"], ["myself", "yourself"],
  ["yourself", "myself"], ["i'm", "you're"], ["you're", "I'm"], ["was", "were"],
]);

/** Splits raw text into normalized words: lowercase, no punctuation. */
export const toWords = (text: string): List<string> =>
  fromArray(
    text
      .toLowerCase()
      .replace(/[^a-z0-9'\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0),
  );

/** Swaps first/second person so captured text reads naturally when echoed back. */
export const swapPronouns = (words: List<string>): List<string> =>
  map((w: string) => PRONOUNS.get(w) ?? w, words);

/**
 * Matches `words` against `pat`. Returns the list of segments captured by
 * each "." wildcard (shortest match first), or undefined if there is no match.
 */
export const matchPattern = (words: List<string>, pat: List<string>): List<List<string>> | undefined => {
  if (pat.kind === "nil") return words.kind === "nil" ? nil : undefined;

  if (pat.hd === "." || pat.hd === "*") {
    const capturing = pat.hd === ".";
    // Try consuming 0, 1, 2, ... words
    const tryFrom = (captured: List<string>, rest: List<string>): List<List<string>> | undefined => {
      const restMatch = matchPattern(rest, pat.tl);
      if (restMatch !== undefined) return capturing ? cons(captured, restMatch) : restMatch;
      if (rest.kind === "nil") return undefined;
      return tryFrom(concat(captured, cons(rest.hd, nil)), rest.tl);
    };
    return tryFrom(nil, words);
  }

  if (words.kind === "nil" || words.hd !== pat.hd) return undefined;
  return matchPattern(words.tl, pat.tl);
};

/** Fills "." slots in a template with the captured segments (pronouns swapped). */
export const fillTemplate = (template: List<string>, captures: List<List<string>>): List<string> => {
  if (template.kind === "nil") return nil;
  if (template.hd === "." && captures.kind === "cons") {
    return concat(swapPronouns(captures.hd), fillTemplate(template.tl, captures.tl));
  }
  return cons(template.hd, fillTemplate(template.tl, captures));
};

/** Picks the next response for a pattern in round-robin order. */
const nextResponse = (pat: Pattern, lastUsed: ReadonlyMap<string, number>) => {
  const prev = lastUsed.get(pat.name) ?? -1;
  const index = (prev + 1) % pat.responses.length;
  const updated = new Map(lastUsed);
  updated.set(pat.name, index);
  return { template: fromArray(pat.responses[index]), lastUsed: updated as ReadonlyMap<string, number> };
};

const joinWords = (words: List<string>): string => {
  const text = toArray(words).join(" ").replace(/ ([?.!,])/g, "$1");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Pure chatbot step: given user input and the current state,
 * returns the bot's reply and the next state. Never mutates its inputs.
 */
export const respond = (
  input: string,
  state: ChatState,
  patterns: ReadonlyArray<Pattern>,
): { readonly reply: string; readonly state: ChatState } => {
  const words = toWords(input);

  for (const pat of patterns) {
    const captures = matchPattern(words, fromArray(pat.contents));
    if (captures === undefined) continue;

    const { template, lastUsed } = nextResponse(pat, state.lastUsed);
    // Remember things the user says about themselves ("my ...") for later.
    const memory =
      pat.name === "my" && captures.kind === "cons" ? cons(captures.hd, state.memory) : state.memory;
    return { reply: joinWords(fillTemplate(template, captures)), state: { lastUsed, memory } };
  }

  // Nothing matched: bring up a remembered topic, or fall back to a generic prompt.
  if (state.memory.kind === "cons") {
    const reply = joinWords(concat(fromArray(["earlier", "you", "said", "that"]),
      concat(swapPronouns(cons("my", state.memory.hd)), fromArray(["."]))));
    return { reply, state: { ...state, memory: state.memory.tl } };
  }

  const fallback = patterns.find((p) => p.name === "fallback");
  if (!fallback) return { reply: "Please go on.", state };
  const { template, lastUsed } = nextResponse(fallback, state.lastUsed);
  return { reply: joinWords(template), state: { ...state, lastUsed } };
};
