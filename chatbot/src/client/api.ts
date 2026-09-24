export type Message = { readonly speaker: "user" | "bot"; readonly text: string };

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

const post = <T,>(url: string, body: unknown) =>
  call<T>(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const api = {
  chat: (session: string, message: string) =>
    post<{ reply: string }>("/api/chat", { session, message }).then((r) => r.reply),
  save: (name: string, messages: ReadonlyArray<Message>) =>
    post<{ replaced: boolean }>("/api/save", { name, messages }).then((r) => r.replaced),
  load: (name: string) =>
    call<{ messages: Message[] }>(`/api/load?name=${encodeURIComponent(name)}`).then((r) => r.messages),
  names: () => call<{ names: string[] }>("/api/names").then((r) => r.names),
};
