import express, { Request, Response } from "express";
import { ChatState, initialState, respond } from "./chatbot.js";
import { PATTERNS } from "./patterns.js";

export type Message = { readonly speaker: "user" | "bot"; readonly text: string };

/**
 * Creates the API app. Server-side state lives in maps owned by this closure;
 * the values stored in them are immutable and replaced wholesale on update.
 */
export const createApp = () => {
  const sessions = new Map<string, ChatState>();
  const transcripts = new Map<string, ReadonlyArray<Message>>();

  const app = express();
  app.use(express.json());

  /** POST /api/chat { session, message } -> { reply } */
  app.post("/api/chat", (req: Request, res: Response) => {
    const { session, message } = req.body ?? {};
    if (typeof session !== "string" || session === "") {
      res.status(400).send("missing 'session'");
      return;
    }
    if (typeof message !== "string" || message.trim() === "") {
      res.status(400).send("missing 'message'");
      return;
    }
    const result = respond(message, sessions.get(session) ?? initialState, PATTERNS);
    sessions.set(session, result.state);
    res.json({ reply: result.reply });
  });

  /** POST /api/save { name, messages } -> { replaced } */
  app.post("/api/save", (req: Request, res: Response) => {
    const { name, messages } = req.body ?? {};
    if (typeof name !== "string" || name.trim() === "") {
      res.status(400).send("missing 'name'");
      return;
    }
    if (!Array.isArray(messages) || !messages.every(isMessage)) {
      res.status(400).send("'messages' must be an array of { speaker, text }");
      return;
    }
    const replaced = transcripts.has(name);
    transcripts.set(name, Object.freeze([...messages]));
    res.json({ replaced });
  });

  /** GET /api/load?name=... -> { messages } */
  app.get("/api/load", (req: Request, res: Response) => {
    const name = req.query.name;
    if (typeof name !== "string") {
      res.status(400).send("missing 'name'");
      return;
    }
    const messages = transcripts.get(name);
    if (messages === undefined) {
      res.status(404).send(`no transcript called '${name}'`);
      return;
    }
    res.json({ messages });
  });

  /** GET /api/names -> { names } */
  app.get("/api/names", (_req: Request, res: Response) => {
    res.json({ names: [...transcripts.keys()].sort() });
  });

  return app;
};

const isMessage = (m: unknown): m is Message =>
  typeof m === "object" && m !== null &&
  ((m as Message).speaker === "user" || (m as Message).speaker === "bot") &&
  typeof (m as Message).text === "string";
