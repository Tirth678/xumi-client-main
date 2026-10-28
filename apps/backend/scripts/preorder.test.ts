import { test } from "node:test";
import assert from "node:assert/strict";
import { createPreorderSchema } from "../src/preorderSchema.js";
import { preorderEmail } from "../src/orderEmail.js";

const input = {
  customerName: "Test Buyer", phone: "9876543210",
  address: { line1: "12 Test Street", city: "Pune", state: "Maharashtra", pincode: "411001" },
};

test("customized orders require nonblank instructions and reject oversized text", () => {
  for (const customization of [undefined, "  ", "a".repeat(2001)]) {
    assert.equal(createPreorderSchema.safeParse({ ...input, edition: "Customized", customization }).success, false);
  }
  const order = createPreorderSchema.parse({ ...input, edition: "Customized", customization: "  Blue shell\nWhite eyes  " });
  assert.equal(order.customization, "Blue shell\nWhite eyes");
});

test("default orders discard hidden customization and reject unsupported editions", () => {
  assert.equal(createPreorderSchema.parse({ ...input, customization: "Old draft" }).customization, null);
  assert.equal(createPreorderSchema.safeParse({ ...input, edition: "Cyber Slate" }).success, false);
});

test("receipt includes shipping estimate and safely escaped customization in both formats", () => {
  const order = {
    id: "TEST-ORDER", customer_name: "Test Buyer", user_email: "buyer@example.com",
    product_name: "XUMI (Customized)", customization: '<script>alert("test")</script>\nBlue shell',
    quantity: 1, unit_price: "3999", total_amount: "3999", currency: "INR",
    created_at: "2026-10-26T00:00:00Z", booking_expires_at: null, payment_url: null,
  };
  const email = preorderEmail(order);
  for (const body of [email.html, email.text]) assert.ok(body.includes("6–10 days"));
  assert.ok(email.text.includes(order.customization));
  assert.ok(email.html.includes("&lt;script&gt;"));
  assert.ok(!email.html.includes("<script>"));
  assert.ok(!preorderEmail({ ...order, customization: null }).html.includes("Customization:"));
});
