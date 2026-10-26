import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { sendEmail, DEFAULT_EMAIL_FROM } from "../src/email.js";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of ["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO"]) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

test("missing credentials fail without contacting Resend", async () => {
  delete process.env.RESEND_API_KEY;
  globalThis.fetch = async () => { throw new Error("Should not fetch"); };
  assert.deepEqual(await sendEmail("delivered@resend.dev", "Test", "Test"), {
    ok: false, error: "RESEND_API_KEY is not configured",
  });
});

test("uses Resend default sender and returns accepted email ID", async () => {
  process.env.RESEND_API_KEY = "test-key";
  delete process.env.EMAIL_FROM;
  delete process.env.EMAIL_REPLY_TO;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    const body = JSON.parse(String(options?.body));
    assert.equal(body.from, DEFAULT_EMAIL_FROM);
    assert.equal(body.reply_to, undefined);
    assert.deepEqual(body.to, ["delivered@resend.dev"]);
    return Response.json({ id: "test-email-id" });
  };
  assert.deepEqual(await sendEmail("delivered@resend.dev", "Test", "Test"), { ok: true, id: "test-email-id" });
});

test("reports default-domain recipient rejection", async () => {
  process.env.RESEND_API_KEY = "test-key";
  globalThis.fetch = async () => Response.json({ message: "You can only send testing emails to your own email address" }, { status: 403 });
  const result = await sendEmail("customer@example.com", "Test", "Test");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 403);
});

test("reports network failures", async () => {
  process.env.RESEND_API_KEY = "test-key";
  globalThis.fetch = async () => { throw new Error("Network unavailable"); };
  const result = await sendEmail("delivered@resend.dev", "Test", "Test");
  assert.equal(result.ok, false);
});
