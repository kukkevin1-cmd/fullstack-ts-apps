import * as assert from "assert";
import request from "supertest";
import { createApp } from "./routes.js";

describe("chatbot routes", () => {
  it("POST /api/chat replies and keeps per-session state", async () => {
    const app = createApp();
    const r1 = await request(app).post("/api/chat").send({ session: "s1", message: "I feel sad" });
    assert.strictEqual(r1.status, 200);
    assert.strictEqual(r1.body.reply, "Why do you feel sad?");

    const r2 = await request(app).post("/api/chat").send({ session: "s1", message: "I feel sad" });
    assert.strictEqual(r2.body.reply, "How long have you felt sad?");

    // A different session starts fresh
    const r3 = await request(app).post("/api/chat").send({ session: "s2", message: "I feel sad" });
    assert.strictEqual(r3.body.reply, "Why do you feel sad?");
  });

  it("POST /api/chat validates input", async () => {
    const app = createApp();
    assert.strictEqual((await request(app).post("/api/chat").send({ message: "hi" })).status, 400);
    assert.strictEqual((await request(app).post("/api/chat").send({ session: "s", message: " " })).status, 400);
  });

  it("saves, lists and loads transcripts", async () => {
    const app = createApp();
    const messages = [{ speaker: "user", text: "hi" }, { speaker: "bot", text: "hello!" }];

    const s1 = await request(app).post("/api/save").send({ name: "first", messages });
    assert.deepStrictEqual(s1.body, { replaced: false });
    const s2 = await request(app).post("/api/save").send({ name: "first", messages });
    assert.deepStrictEqual(s2.body, { replaced: true });

    assert.deepStrictEqual((await request(app).get("/api/names")).body, { names: ["first"] });
    assert.deepStrictEqual((await request(app).get("/api/load?name=first")).body, { messages });
    assert.strictEqual((await request(app).get("/api/load?name=nope")).status, 404);
  });

  it("rejects malformed transcripts", async () => {
    const app = createApp();
    const res = await request(app).post("/api/save").send({ name: "x", messages: [{ speaker: "alien", text: 1 }] });
    assert.strictEqual(res.status, 400);
  });
});
