import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createRateLimiter } from "../src/rateLimit.js";

// Import the app only after fixing NODE_ENV so CORS behaves predictably.
process.env.NODE_ENV = "test";
delete process.env.WEB_ORIGIN;
delete process.env.VERCEL_URL;
delete process.env.VERCEL_BRANCH_URL;
delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
const { default: app } = await import("../src/app.js");

let server: Server;
let base: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => new Promise<void>((resolve, reject) => {
  server.close((err) => (err ? reject(err) : resolve()));
}));

test("health endpoint responds with security headers and no-store", async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("unknown API routes return a JSON 404", async () => {
  const response = await fetch(`${base}/api/definitely-not-a-route`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Not found" });
});

test("malformed JSON is a 400 client error, not a 500", async () => {
  const response = await fetch(`${base}/api/preorders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json",
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Request body must be valid JSON" });
});

test("oversized bodies are rejected with 413", async () => {
  const response = await fetch(`${base}/api/preorders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blob: "x".repeat(64 * 1024) }),
  });
  assert.equal(response.status, 413);
});

test("CORS: localhost allowed outside production, foreign origins rejected, own Vercel URL allowed", async () => {
  const local = await fetch(`${base}/api/health`, { headers: { Origin: "http://localhost:5173" } });
  assert.equal(local.headers.get("access-control-allow-origin"), "http://localhost:5173");

  const foreign = await fetch(`${base}/api/health`, { headers: { Origin: "https://evil.example.com" } });
  assert.equal(foreign.headers.get("access-control-allow-origin"), null);

  const randomVercel = await fetch(`${base}/api/health`, { headers: { Origin: "https://someone-elses-project.vercel.app" } });
  assert.equal(randomVercel.headers.get("access-control-allow-origin"), null);

  process.env.VERCEL_PROJECT_PRODUCTION_URL = "xumi.vercel.app";
  try {
    const own = await fetch(`${base}/api/health`, { headers: { Origin: "https://xumi.vercel.app" } });
    assert.equal(own.headers.get("access-control-allow-origin"), "https://xumi.vercel.app");
  } finally {
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  }

  process.env.WEB_ORIGIN = "https://shop.example.com/";
  try {
    const configured = await fetch(`${base}/api/health`, { headers: { Origin: "https://shop.example.com" } });
    assert.equal(configured.headers.get("access-control-allow-origin"), "https://shop.example.com");
  } finally {
    delete process.env.WEB_ORIGIN;
  }
});

test("admin routes require authentication even before rate limits kick in", async () => {
  const response = await fetch(`${base}/api/admin/preorders`);
  assert.equal(response.status, 401);
});

test("rate limiter blocks after the budget and advertises Retry-After", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 2, keyFor: () => "fixed" });
  const statuses: number[] = [];
  const headers: Record<string, string> = {};
  const fakeResponse = {
    setHeader(name: string, value: string) { headers[name] = value; },
    status(code: number) { statuses.push(code); return this; },
    json() { return this; },
  };
  let passed = 0;
  const next = () => { passed += 1; };

  for (let i = 0; i < 5; i += 1) {
    limiter({ ip: "1.2.3.4" } as never, fakeResponse as never, next);
  }
  assert.equal(passed, 2);
  assert.deepEqual(statuses, [429, 429, 429]);
  assert.ok(Number(headers["Retry-After"]) >= 1);
});
