import * as assert from "assert";
import request from "supertest";
import { createApp } from "./routes.js";

describe("polls routes", () => {
  let time = 0;
  const clock = () => time;
  const add = (app: ReturnType<typeof createApp>, name: string, minutes = 5) =>
    request(app).post("/api/add").send({ name, options: ["yes", "no"], minutes });

  beforeEach(() => { time = 1_000_000; });

  it("adds a poll and lists it", async () => {
    const app = createApp(clock);
    const res = await add(app, "q1");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.poll.open, true);

    const list = await request(app).get("/api/list");
    assert.deepStrictEqual(list.body.polls.map((p: { name: string }) => p.name), ["q1"]);
  });

  it("rejects duplicate names and bad bodies", async () => {
    const app = createApp(clock);
    await add(app, "q1");
    assert.strictEqual((await add(app, "q1")).status, 400);
    assert.strictEqual((await request(app).post("/api/add").send({ name: "x" })).status, 400);
    assert.strictEqual((await request(app).post("/api/add").send({ name: "x", options: ["a"], minutes: 5 })).status, 400);
  });

  it("records votes and reports results", async () => {
    const app = createApp(clock);
    await add(app, "q1");
    await request(app).post("/api/vote").send({ name: "q1", voter: "a", option: "yes" });
    const res = await request(app).post("/api/vote").send({ name: "q1", voter: "b", option: "no" });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.poll.totalVotes, 2);

    const got = await request(app).get("/api/get?name=q1");
    assert.deepStrictEqual(got.body.poll.results, [
      { option: "yes", count: 1, percent: 50 },
      { option: "no", count: 1, percent: 50 },
    ]);
  });

  it("refuses votes after the poll closes", async () => {
    const app = createApp(clock);
    await add(app, "q1", 1);
    time += 60_000;
    const res = await request(app).post("/api/vote").send({ name: "q1", voter: "a", option: "yes" });
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await request(app).get("/api/get?name=q1")).body.poll.open, false);
  });

  it("returns 404 for unknown polls", async () => {
    const app = createApp(clock);
    assert.strictEqual((await request(app).get("/api/get?name=nope")).status, 404);
    assert.strictEqual((await request(app).post("/api/vote").send({ name: "nope", voter: "a", option: "x" })).status, 404);
  });
});
