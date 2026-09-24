import express, { Request, Response } from "express";
import { Poll, castVote, createPoll, sortPolls, summarize } from "./polls.js";

/** `now` is injectable so tests can control time. */
export const createApp = (now: () => number = Date.now) => {
  const polls = new Map<string, Poll>();
  const app = express();
  app.use(express.json());

  /** GET /api/list -> { polls: Summary[] } */
  app.get("/api/list", (_req: Request, res: Response) => {
    const t = now();
    res.json({ polls: sortPolls([...polls.values()], t).map((p) => summarize(p, t)) });
  });

  /** POST /api/add { name, options, minutes } -> { poll } */
  app.post("/api/add", (req: Request, res: Response) => {
    const { name, options, minutes } = req.body ?? {};
    if (typeof name !== "string" || !Array.isArray(options) || !options.every((o) => typeof o === "string")) {
      res.status(400).send("expected { name: string, options: string[], minutes: number }");
      return;
    }
    if (polls.has(name.trim())) {
      res.status(400).send(`poll "${name}" already exists`);
      return;
    }
    const result = createPoll(name, options, Number(minutes), now());
    if (!result.ok) {
      res.status(400).send(result.error);
      return;
    }
    polls.set(result.value.name, result.value);
    res.json({ poll: summarize(result.value, now()) });
  });

  /** GET /api/get?name=... -> { poll } */
  app.get("/api/get", (req: Request, res: Response) => {
    const poll = typeof req.query.name === "string" ? polls.get(req.query.name) : undefined;
    if (!poll) {
      res.status(404).send("no such poll");
      return;
    }
    res.json({ poll: summarize(poll, now()) });
  });

  /** POST /api/vote { name, voter, option } -> { poll } */
  app.post("/api/vote", (req: Request, res: Response) => {
    const { name, voter, option } = req.body ?? {};
    const poll = typeof name === "string" ? polls.get(name) : undefined;
    if (!poll) {
      res.status(404).send("no such poll");
      return;
    }
    if (typeof voter !== "string" || typeof option !== "string") {
      res.status(400).send("expected { voter: string, option: string }");
      return;
    }
    const result = castVote(poll, voter, option, now());
    if (!result.ok) {
      res.status(400).send(result.error);
      return;
    }
    polls.set(name, result.value); // replace, never mutate
    res.json({ poll: summarize(result.value, now()) });
  });

  return app;
};
