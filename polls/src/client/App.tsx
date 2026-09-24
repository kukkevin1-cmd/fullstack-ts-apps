import { useState } from "react";
import { PollList } from "./PollList";
import { NewPoll } from "./NewPoll";
import { PollDetails } from "./PollDetails";

/** Discriminated union for the current page: no invalid combinations of state. */
type Page = { kind: "list" } | { kind: "new" } | { kind: "details"; name: string };

export function App() {
  const [page, setPage] = useState<Page>({ kind: "list" });
  const toList = () => setPage({ kind: "list" });

  return (
    <main>
      <h1>Polls</h1>
      {page.kind === "list" && (
        <PollList onNew={() => setPage({ kind: "new" })} onOpen={(name) => setPage({ kind: "details", name })} />
      )}
      {page.kind === "new" && <NewPoll onBack={toList} onCreated={(name) => setPage({ kind: "details", name })} />}
      {page.kind === "details" && <PollDetails name={page.name} onBack={toList} />}
    </main>
  );
}
