import { afterEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import nodemailer from "nodemailer";
import { sendEmail } from "../src/email.js";

const originalEnv = { ...process.env };
afterEach(() => {
  mock.restoreAll();
  for (const key of ["GMAIL_USER", "GMAIL_APP_PASSWORD", "EMAIL_FROM", "EMAIL_REPLY_TO"]) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

function configure() {
  process.env.GMAIL_USER = "sender@gmail.com";
  process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
  delete process.env.EMAIL_FROM;
  delete process.env.EMAIL_REPLY_TO;
}

function stubTransport(sendMail: (mail: any) => Promise<any>) {
  return mock.method(nodemailer, "createTransport", (options: any) => {
    assert.equal(options.host, "smtp.gmail.com");
    assert.equal(options.port, 465);
    assert.equal(options.secure, true);
    assert.deepEqual(options.auth, { user: "sender@gmail.com", pass: "abcdefghijklmnop" });
    return { sendMail };
  });
}

test("missing credentials fail before opening SMTP", async () => {
  configure();
  const transport = stubTransport(async () => { throw new Error("Should not send"); });
  for (const key of ["GMAIL_USER", "GMAIL_APP_PASSWORD"]) {
    configure();
    delete process.env[key];
    assert.deepEqual(await sendEmail("customer@example.com", "Test", "Test"), {
      ok: false, error: "GMAIL_USER and GMAIL_APP_PASSWORD must be configured",
    });
  }
  assert.equal(transport.mock.callCount(), 0);
});

test("sends content with authenticated default sender over TLS", async () => {
  configure();
  stubTransport(async (mail) => {
    assert.deepEqual(mail, {
      from: { name: "RoboCraft", address: "sender@gmail.com" },
      replyTo: undefined, to: "customer@example.com", subject: "Test", html: "<p>Test</p>", text: "Test",
    });
    return { messageId: "test-id", accepted: ["customer@example.com"], rejected: [] };
  });
  assert.deepEqual(await sendEmail("customer@example.com", "Test", "<p>Test</p>", "Test"), { ok: true, id: "test-id" });
});

test("preserves configured sender, reply-to, and multiple recipients", async () => {
  configure();
  process.env.EMAIL_FROM = "Shop <sender@gmail.com>";
  process.env.EMAIL_REPLY_TO = "support@example.com";
  const recipients = ["one@example.com", "two@example.com"];
  stubTransport(async (mail) => {
    assert.equal(mail.from, process.env.EMAIL_FROM);
    assert.equal(mail.replyTo, process.env.EMAIL_REPLY_TO);
    assert.deepEqual(mail.to, recipients);
    return { messageId: "test-id", accepted: recipients, rejected: [] };
  });
  assert.equal((await sendEmail(recipients, "Test", "Test")).ok, true);
});

test("reports rejected recipients and missing SMTP acceptance", async () => {
  configure();
  for (const response of [
    { messageId: "id", accepted: ["one@example.com"], rejected: ["two@example.com"] },
    { messageId: "id", accepted: [], rejected: [] },
    { accepted: ["one@example.com"], rejected: [] },
  ]) {
    stubTransport(async () => response);
    assert.equal((await sendEmail(["one@example.com", "two@example.com"], "Test", "Test")).ok, false);
    mock.restoreAll();
  }
});

test("SMTP auth and network errors fail without leaking provider details", async () => {
  configure();
  stubTransport(async () => { throw new Error("secret provider details"); });
  const result = await sendEmail("customer@example.com", "Test", "Test");
  assert.equal(result.ok, false);
  assert.ok(!JSON.stringify(result).includes("secret provider details"));
});
