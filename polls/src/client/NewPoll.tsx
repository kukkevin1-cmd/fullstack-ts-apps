import { useState } from "react";
import { api } from "./api";

type Props = { onBack: () => void; onCreated: (name: string) => void };

export function NewPoll({ onBack, onCreated }: Props) {
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("10");
  const [options, setOptions] = useState<ReadonlyArray<string>>(["", ""]);
  const [error, setError] = useState("");

  // Immutable updates to the options array
  const setOption = (i: number, value: string) => setOptions(options.map((o, j) => (j === i ? value : o)));
  const addOption = () => setOptions([...options, ""]);
  const removeOption = (i: number) => setOptions(options.filter((_, j) => j !== i));

  const submit = async () => {
    setError("");
    try {
      const poll = await api.add(name, options, Number(minutes));
      onCreated(poll.name);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="card">
      <h3>New poll</h3>
      <div className="row"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Question" /></div>
      <div className="row">
        <label>Minutes open: <input type="number" min={1} value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ width: 90 }} /></label>
      </div>
      {options.map((o, i) => (
        <div className="row" key={i}>
          <input value={o} onChange={(e) => setOption(i, e.target.value)} placeholder={`Option ${i + 1}`} />
          {options.length > 2 && <button type="button" onClick={() => removeOption(i)}>✕</button>}
        </div>
      ))}
      <div className="row">
        <button type="button" onClick={addOption}>Add option</button>
        <button onClick={submit}>Create</button>
        <button type="button" onClick={onBack}>Back</button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
