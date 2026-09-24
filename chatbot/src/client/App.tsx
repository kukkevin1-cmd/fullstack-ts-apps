import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { Message } from "./api";

// Stable id so the server can keep per-conversation state
const newSession = () => Math.random().toString(36).slice(2);

export function App() {
  const [session, setSession] = useState<string>(newSession);
  const [messages, setMessages] = useState<ReadonlyArray<Message>>([]);
  const [input, setInput] = useState("");
  const [names, setNames] = useState<ReadonlyArray<string>>([]);
  const [saveName, setSaveName] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.names().then(setNames).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setError("");
    // Immutable update: build a new array instead of pushing
    setMessages((prev) => [...prev, { speaker: "user", text }]);
    try {
      const reply = await api.chat(session, text);
      setMessages((prev) => [...prev, { speaker: "bot", text: reply }]);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const save = async () => {
    try {
      const replaced = await api.save(saveName.trim(), messages);
      setStatus(replaced ? `Replaced "${saveName}"` : `Saved "${saveName}"`);
      setNames(await api.names());
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const load = async (name: string) => {
    try {
      setMessages(await api.load(name));
      setSession(newSession());
      setStatus(`Loaded "${name}"`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const reset = () => {
    setMessages([]);
    setSession(newSession());
    setStatus("");
  };

  return (
    <main>
      <h1>Chatbot</h1>
      <p className="muted">A pattern-matching therapist bot, written with pure functions and immutable data.</p>

      <div className="card" style={{ minHeight: 300 }}>
        {messages.length === 0 && <p className="muted">Say hello to get started.</p>}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.speaker}`}>{m.text}</div>
        ))}
        <div ref={bottom} />
      </div>

      <form className="row" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message" autoFocus />
        <button disabled={!input.trim()}>Send</button>
        <button type="button" onClick={reset}>New chat</button>
      </form>

      <div className="card">
        <h3>Transcripts</h3>
        <div className="row">
          <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Transcript name" />
          <button onClick={save} disabled={!saveName.trim() || messages.length === 0}>Save</button>
        </div>
        {names.length > 0 && (
          <p>
            Load:{" "}
            {names.map((n) => (
              <button key={n} className="link" style={{ marginRight: 8 }} onClick={() => load(n)}>{n}</button>
            ))}
          </p>
        )}
        {status && <p className="muted">{status}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}
