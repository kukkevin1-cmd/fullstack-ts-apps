/**
 * Pure poll logic. A Poll is never mutated; every operation returns a new Poll
 * (or an error). This keeps server state changes explicit and easy to test.
 */
export type Vote = { readonly voter: string; readonly option: string };

export type Poll = {
  readonly name: string;
  readonly options: ReadonlyArray<string>;
  readonly endTime: number; // ms since epoch
  readonly votes: ReadonlyArray<Vote>;
};

export type Result<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string };

const ok = <T,>(value: T): Result<T> => ({ ok: true, value });
const err = <T,>(error: string): Result<T> => ({ ok: false, error });

export type Tally = { readonly option: string; readonly count: number; readonly percent: number };

export const createPoll = (
  name: string,
  options: ReadonlyArray<string>,
  minutes: number,
  now: number,
): Result<Poll> => {
  const trimmed = options.map((o) => o.trim()).filter((o) => o !== "");
  if (name.trim() === "") return err("name is required");
  if (trimmed.length < 2) return err("a poll needs at least 2 options");
  if (new Set(trimmed).size !== trimmed.length) return err("options must be unique");
  if (!Number.isInteger(minutes) || minutes < 1) return err("minutes must be a positive integer");
  return ok({ name: name.trim(), options: Object.freeze(trimmed), endTime: now + minutes * 60_000, votes: [] });
};

export const isOpen = (poll: Poll, now: number): boolean => now < poll.endTime;

/** Records a vote. A voter who votes again replaces their earlier vote. */
export const castVote = (poll: Poll, voter: string, option: string, now: number): Result<Poll> => {
  if (!isOpen(poll, now)) return err(`poll "${poll.name}" is closed`);
  if (voter.trim() === "") return err("voter name is required");
  if (!poll.options.includes(option)) return err(`"${option}" is not an option`);
  const votes = [...poll.votes.filter((v) => v.voter !== voter.trim()), { voter: voter.trim(), option }];
  return ok({ ...poll, votes: Object.freeze(votes) });
};

/** Counts votes per option, preserving option order. Percents are rounded. */
export const tally = (poll: Poll): ReadonlyArray<Tally> => {
  const total = poll.votes.length;
  return poll.options.map((option) => {
    const count = poll.votes.filter((v) => v.option === option).length;
    return { option, count, percent: total === 0 ? 0 : Math.round((100 * count) / total) };
  });
};

/** Open polls first (ending soonest first), then closed polls (most recently closed first). */
export const sortPolls = (polls: ReadonlyArray<Poll>, now: number): ReadonlyArray<Poll> => {
  const open = polls.filter((p) => isOpen(p, now)).sort((a, b) => a.endTime - b.endTime);
  const closed = polls.filter((p) => !isOpen(p, now)).sort((a, b) => b.endTime - a.endTime);
  return [...open, ...closed];
};

/** Public summary sent to clients: hides who voted for what. */
export const summarize = (poll: Poll, now: number) => ({
  name: poll.name,
  options: poll.options,
  endTime: poll.endTime,
  open: isOpen(poll, now),
  totalVotes: poll.votes.length,
  results: tally(poll),
});
