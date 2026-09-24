# Full-stack TypeScript Apps: Chatbot & Polls

Two full-stack web apps built with **React + Node.js (Express) + TypeScript**, written in a
**functional programming** style: pure functions, immutable data, and discriminated unions.
Every piece of core logic is covered by **Mocha** unit tests.

Originally built for a Full-stack Software Design & Implementation course (Sept – Dec 2023);
rebuilt in 2026 after the original repo was lost.

| App | What it does | Tests |
| --- | --- | --- |
| [`chatbot/`](chatbot) | ELIZA-style therapist chatbot with pattern matching, per-session memory, and saved transcripts | 21 |
| [`polls/`](polls) | Create timed polls, vote, and view results after the poll closes | 16 |

## Design principles

- **Immutability.** Server state is stored as immutable values that are *replaced*, never
  mutated (`castVote` returns a new `Poll`; `respond` returns a new `ChatState`). React state
  is updated with new arrays/objects only (`[...prev, msg]`, `options.map(...)`).
- **Pure core, thin shell.** All domain logic (`chatbot.ts`, `polls.ts`, `list.ts`) is pure
  and has no Express or I/O dependencies. Routes just validate input, call the pure
  functions, and store the result. Time is injected (`createApp(now)`) so tests are deterministic.
- **Types that rule out bad states.** `Result<T>` for errors instead of exceptions,
  `readonly` everywhere, and a `Page` union in the Polls client so only valid screens exist.
- **Recursive data structures.** The chatbot uses a hand-written immutable linked list
  (`List<A> = nil | cons(hd, tl)`) with recursive `concat`, `map`, and pattern matching.

## Running

Each app is independent:

```bash
cd chatbot            # or: cd polls
npm install
npm run dev           # API on :8080, React client on http://localhost:5173
npm test              # Mocha unit tests
npm run build         # type-check + production build
```

## Tech stack

TypeScript · React 19 · Vite · Node.js · Express · Mocha · Supertest
