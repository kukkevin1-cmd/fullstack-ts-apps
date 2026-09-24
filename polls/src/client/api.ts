export type Tally = { readonly option: string; readonly count: number; readonly percent: number };

export type PollSummary = {
  readonly name: string;
  readonly options: ReadonlyArray<string>;
  readonly endTime: number;
  readonly open: boolean;
  readonly totalVotes: number;
  readonly results: ReadonlyArray<Tally>;
};

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

const post = <T,>(url: string, body: unknown) =>
  call<T>(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const api = {
  list: () => call<{ polls: PollSummary[] }>("/api/list").then((r) => r.polls),
  get: (name: string) => call<{ poll: PollSummary }>(`/api/get?name=${encodeURIComponent(name)}`).then((r) => r.poll),
  add: (name: string, options: ReadonlyArray<string>, minutes: number) =>
    post<{ poll: PollSummary }>("/api/add", { name, options, minutes }).then((r) => r.poll),
  vote: (name: string, voter: string, option: string) =>
    post<{ poll: PollSummary }>("/api/vote", { name, voter, option }).then((r) => r.poll),
};

/** Pure helper: "3 minutes left" / "closed 5 minutes ago". */
export const describeTime = (endTime: number, now: number): string => {
  const mins = Math.round(Math.abs(endTime - now) / 60_000);
  if (mins === 0) return endTime > now ? "closing now" : "closed just now";
  const unit = mins === 1 ? "minute" : "minutes";
  return endTime > now ? `${mins} ${unit} left` : `closed ${mins} ${unit} ago`;
};
