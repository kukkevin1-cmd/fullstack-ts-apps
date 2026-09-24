import { Pattern } from "./chatbot.js";

/** Patterns are tried in order; the first match wins. */
export const PATTERNS: ReadonlyArray<Pattern> = [
  {
    name: "hello",
    contents: ["hello", "*"],
    responses: [["hi", "there!", "How", "are", "you", "feeling", "today?"]],
  },
  {
    name: "hi",
    contents: ["hi", "*"],
    responses: [["hello!", "what", "would", "you", "like", "to", "talk", "about?"]],
  },
  {
    name: "i feel",
    contents: ["*", "i", "feel", "."],
    responses: [
      ["why", "do", "you", "feel", ".", "?"],
      ["how", "long", "have", "you", "felt", ".", "?"],
      ["do", "you", "often", "feel", ".", "?"],
    ],
  },
  {
    name: "i am",
    contents: ["*", "i", "am", "."],
    responses: [
      ["how", "long", "have", "you", "been", ".", "?"],
      ["why", "do", "you", "think", "you", "are", ".", "?"],
    ],
  },
  {
    name: "because",
    contents: ["*", "because", "."],
    responses: [
      ["is", "that", "the", "real", "reason?"],
      ["what", "other", "reasons", "come", "to", "mind?"],
    ],
  },
  {
    name: "my",
    contents: ["*", "my", "."],
    responses: [
      ["you", "mentioned", "that", "your", ".", "--", "can", "you", "tell", "me", "more?"],
      ["why", "is", "your", ".", "important", "to", "you?"],
    ],
  },
  {
    name: "you",
    contents: ["*", "you", "."],
    responses: [
      ["we", "were", "talking", "about", "you,", "not", "me."],
      ["why", "do", "you", "say", "I", "."],
    ],
  },
  {
    name: "fallback",
    contents: ["__never_matches__"],
    responses: [["please", "go", "on."], ["tell", "me", "more."], ["how", "does", "that", "make", "you", "feel?"]],
  },
];
