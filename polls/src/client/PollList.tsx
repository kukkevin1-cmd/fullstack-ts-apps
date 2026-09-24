import { useEffect, useState } from "react";
import { api, describeTime } from "./api";
import type { PollSummary } from "./api";

type Props = { onNew: () => void; onOpen: (name: string) => void };

export function PollList({ onNew, onOpen }: Props) {
  const [polls, setPolls] = useState<ReadonlyArray<PollSummary> | undefined>(undefined);
  const [error, setError] = useState("");

  const refresh = () => api.list().then(setPolls).catch((e: Error) => setError(e.message));
  useEffect(() => { refresh(); }, []);

  if (polls === undefined) return <p className="muted">Loading…</p>;

  const now = Date.now();
  const section = (title: string, items: ReadonlyArray<PollSummary>) => (
    <div className="card">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="muted">None</p> : (
        <ul>
          {items.map((p) => (
            <li key={p.name}>
              <button className="link" onClick={() => onOpen(p.name)}>{p.name}</button>{" "}
              <span className="muted">– {describeTime(p.endTime, now)}, {p.totalVotes} {p.totalVotes === 1 ? "vote" : "votes"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <>
      {section("Open", polls.filter((p) => p.open))}
      {section("Closed", polls.filter((p) => !p.open))}
      <div className="row">
        <button onClick={onNew}>New poll</button>
        <button onClick={refresh}>Refresh</button>
      </div>
      {error && <p className="error">{error}</p>}
    </>
  );
}
