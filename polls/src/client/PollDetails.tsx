import { useEffect, useState } from "react";
import { api, describeTime } from "./api";
import type { PollSummary } from "./api";

type Props = { name: string; onBack: () => void };

export function PollDetails({ name, onBack }: Props) {
  const [poll, setPoll] = useState<PollSummary | undefined>(undefined);
  const [voter, setVoter] = useState("");
  const [choice, setChoice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = () => api.get(name).then(setPoll).catch((e: Error) => setError(e.message));
  useEffect(() => { refresh(); }, [name]);

  if (poll === undefined) return <p className="muted">{error || "Loading…"}</p>;

  const submit = async () => {
    setError("");
    try {
      setPoll(await api.vote(poll.name, voter, choice));
      setMessage(`Recorded vote of "${voter}" for "${choice}"`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="card">
      <h3>{poll.name}</h3>
      <p className="muted">{describeTime(poll.endTime, Date.now())} · {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}</p>

      {poll.open ? (
        <>
          {poll.options.map((o) => (
            <div key={o}>
              <label>
                <input type="radio" name="option" checked={choice === o} onChange={() => setChoice(o)} /> {o}
              </label>
            </div>
          ))}
          <div className="row">
            <input value={voter} onChange={(e) => setVoter(e.target.value)} placeholder="Your name" />
            <button onClick={submit} disabled={!voter.trim() || !choice}>Vote</button>
          </div>
        </>
      ) : (
        poll.results.map((r) => (
          <div key={r.option} style={{ margin: "8px 0" }}>
            <div>{r.option} — {r.count} ({r.percent}%)</div>
            <div className="bar"><div style={{ width: `${r.percent}%` }} /></div>
          </div>
        ))
      )}

      <div className="row">
        <button onClick={refresh}>Refresh</button>
        <button onClick={onBack}>Back</button>
      </div>
      {message && <p className="muted">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
