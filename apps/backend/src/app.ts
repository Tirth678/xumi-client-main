import crypto from "node:crypto";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { neon } from "@neondatabase/serverless";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";
import { preorderEmail } from "./orderEmail.js";

const PRODUCT = { id: "xumi", name: "XUMI", unitPrice: 3999, currency: "INR" } as const;

const createPreorderSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{8,17}$/),
  quantity: z.coerce.number().int().min(1).max(10).optional().default(1),
  edition: z.string().trim().max(50).optional(),
  address: z.object({
    line1: z.string().trim().min(5).max(200),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    pincode: z.string().trim().regex(/^[A-Za-z0-9\s-]{3,10}$/),
  }),
});
const requestPaymentSchema = z.object({ paymentUrl: z.string().url().optional() });

type AuthenticatedRequest = Request & { user: { id: string; email: string; name?: string } };
type PreorderRow = {
  id: string; user_id: string; user_email: string; customer_name: string; phone: string;
  address_line1: string; city: string; state: string; pincode: string; product_id: string;
  product_name: string; quantity: number; unit_price: string; total_amount: string; currency: string;
  status: "received" | "payment_pending" | "paid" | "expired" | "cancelled";
  payment_url: string | null; booking_expires_at: string | null; paid_at: string | null;
  created_at: string; updated_at: string;
};

const requiredEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};
const getSql = () => neon(requiredEnv("DATABASE_URL"));
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
const getJwks = () => (jwks ??= createRemoteJWKSet(new URL(requiredEnv("NEON_AUTH_JWKS_URL"))));

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
const allowedOrigins = () => (process.env.WEB_ORIGIN ?? "http://localhost:8080,http://localhost:5173").split(",").map((v) => v.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => !origin || allowedOrigins().includes(origin) ? callback(null, true) : callback(new Error("Origin is not allowed")) }));
app.use(express.json({ limit: "32kb" }));

const asyncRoute = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => { Promise.resolve(handler(req, res, next)).catch(next); };

const authenticate = asyncRoute(async (request, response, next) => {
  const header = request.header("authorization");
  if (!header?.startsWith("Bearer ")) return response.status(401).json({ error: "Authentication required" });
  const { payload } = await jwtVerify(header.slice(7).trim(), getJwks(), { issuer: requiredEnv("NEON_AUTH_BASE_URL") });
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!payload.sub || !email) return response.status(401).json({ error: "The session is missing required identity claims" });
  (request as AuthenticatedRequest).user = { id: payload.sub, email, name: typeof payload.name === "string" ? payload.name : undefined };
  next();
});

const constantTimeEqual = (left: string, right: string) => {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const authenticateAdmin = (request: Request, response: Response, next: NextFunction) => {
  const header = request.header("authorization");
  const supplied = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const expected = process.env.ADMIN_API_KEY?.trim() ?? "";
  if (!expected || !supplied || !constantTimeEqual(supplied, expected)) return response.status(401).json({ error: "Admin authentication required" });
  next();
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]!);
const formatAmount = (amount: string | number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: PRODUCT.currency }).format(Number(amount));
const sendEmail = async (to: string | string[], subject: string, html: string, text?: string) => {
  const result = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${requiredEnv("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM?.trim() || "RoboCraft <onboarding@resend.dev>", reply_to: process.env.EMAIL_REPLY_TO || "support@robocraft.com", to: Array.isArray(to) ? to : [to], subject, html, text }),
  });
  if (!result.ok) throw new Error(`Email delivery failed (${result.status}): ${(await result.text()).slice(0, 200)}`);
};

const serializePreorder = (row: PreorderRow) => ({
  id: row.id, productId: row.product_id, productName: row.product_name, price: Number(row.unit_price),
  quantity: row.quantity, totalAmount: Number(row.total_amount), currency: row.currency,
  customerName: row.customer_name, email: row.user_email, phone: row.phone,
  address: { line1: row.address_line1, city: row.city, state: row.state, pincode: row.pincode },
  status: row.status, paymentUrl: row.payment_url, bookingExpiresAt: row.booking_expires_at,
  paidAt: row.paid_at, createdAt: row.created_at, updatedAt: row.updated_at,
});
const expireOverduePreorders = async () => { await getSql()`UPDATE preorders SET status = 'expired', updated_at = NOW() WHERE status IN ('received', 'payment_pending') AND COALESCE(booking_expires_at, created_at + INTERVAL '15 days') <= NOW()`; };

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

app.post("/api/preorders", authenticate, asyncRoute(async (request, response) => {
  const parsed = createPreorderSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Please check the submitted details", issues: parsed.error.flatten() });
  const user = (request as AuthenticatedRequest).user; const input = parsed.data; const sql = getSql();
  await expireOverduePreorders();
  const existing = await sql`SELECT * FROM preorders WHERE user_id = ${user.id} AND status NOT IN ('expired', 'cancelled') ORDER BY created_at DESC LIMIT 1` as PreorderRow[];
  if (existing[0]) return response.status(200).json({ preorder: serializePreorder(existing[0]), existing: true });
  const quantity = input.quantity ?? 1;
  const productName = input.edition ? `${PRODUCT.name} (${input.edition})` : PRODUCT.name;
  const totalAmount = PRODUCT.unitPrice * quantity;
  const rows = await sql`
    INSERT INTO preorders (user_id, user_email, customer_name, phone, address_line1, city, state, pincode, product_id, product_name, quantity, unit_price, total_amount, currency, status, booking_expires_at)
    VALUES (${user.id}, ${user.email}, ${input.customerName}, ${input.phone}, ${input.address.line1}, ${input.address.city}, ${input.address.state}, ${input.address.pincode}, ${PRODUCT.id}, ${productName}, ${quantity}, ${PRODUCT.unitPrice}, ${totalAmount}, ${PRODUCT.currency}, 'received', NOW() + INTERVAL '15 days') RETURNING *
  ` as PreorderRow[];
  const preorder = rows[0];
  const email = preorderEmail(preorder);
  await Promise.all([
    sendEmail(preorder.user_email, `RoboCraft — pre-order received #${preorder.id}`, email.html, email.text),
    sendEmail(requiredEnv("ADMIN_EMAIL"), `New ${PRODUCT.name} pre-order ${preorder.id}`, `<h1>New pre-order</h1><p><strong>${escapeHtml(preorder.customer_name)}</strong> (${escapeHtml(preorder.user_email)}) reserved ${PRODUCT.name}.</p><p>Order: ${escapeHtml(preorder.id)} · ${formatAmount(preorder.total_amount)}</p>`),
  ]);
  return response.status(201).json({ preorder: serializePreorder(preorder), existing: false });
}));

app.get("/api/preorders", authenticate, asyncRoute(async (request, response) => {
  await expireOverduePreorders(); const user = (request as AuthenticatedRequest).user;
  const rows = await getSql()`SELECT * FROM preorders WHERE user_id = ${user.id} ORDER BY created_at DESC` as PreorderRow[];
  response.json({ preorders: rows.map(serializePreorder) });
}));

app.get("/api/admin/preorders", authenticateAdmin, asyncRoute(async (_request, response) => {
  await expireOverduePreorders(); const rows = await getSql()`SELECT * FROM preorders ORDER BY created_at DESC LIMIT 500` as PreorderRow[];
  response.json({ preorders: rows.map(serializePreorder) });
}));

app.post("/api/admin/preorders/:id/request-payment", authenticateAdmin, asyncRoute(async (request, response) => {
  const parsed = requestPaymentSchema.safeParse(request.body ?? {});
  if (!parsed.success) return response.status(400).json({ error: "paymentUrl must be a valid URL" });
  const paymentUrl = parsed.data.paymentUrl ?? process.env.PAYMENT_URL?.trim();
  if (!paymentUrl || !z.string().url().safeParse(paymentUrl).success) return response.status(400).json({ error: "Provide paymentUrl or configure PAYMENT_URL" });
  const rows = await getSql()`UPDATE preorders SET status = 'payment_pending', payment_url = ${paymentUrl}, booking_expires_at = created_at + INTERVAL '15 days', updated_at = NOW() WHERE id = ${request.params.id} AND status = 'received' AND created_at + INTERVAL '15 days' > NOW() RETURNING *` as PreorderRow[];
  const preorder = rows[0]; if (!preorder) return response.status(409).json({ error: "Order is missing or no longer awaiting review" });
  await sendEmail(preorder.user_email, `Complete your ${PRODUCT.name} booking within 15 days`, `<h1>Your ${PRODUCT.name} is ready to book</h1><p>Hi ${escapeHtml(preorder.customer_name)},</p><p>Order <strong>${escapeHtml(preorder.id)}</strong> · Qty ${preorder.quantity} · <strong>${formatAmount(preorder.total_amount)}</strong>.</p><p><a href="${escapeHtml(paymentUrl)}">Pay securely</a></p><p>This booking link expires on ${new Date(preorder.booking_expires_at!).toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" })}.</p>`);
  response.json({ preorder: serializePreorder(preorder) });
}));

app.post("/api/admin/preorders/:id/confirm-payment", authenticateAdmin, asyncRoute(async (request, response) => {
  const rows = await getSql()`UPDATE preorders SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = ${request.params.id} AND status = 'payment_pending' AND booking_expires_at > NOW() RETURNING *` as PreorderRow[];
  const preorder = rows[0]; if (!preorder) return response.status(409).json({ error: "Order cannot be confirmed in its current state" });
  await sendEmail(preorder.user_email, `Payment confirmed for ${PRODUCT.name} order ${preorder.id}`, `<h1>Booking confirmed</h1><p>Hi ${escapeHtml(preorder.customer_name)},</p><p>We verified your payment of <strong>${formatAmount(preorder.total_amount)}</strong> for ${PRODUCT.name}. Your order <strong>${escapeHtml(preorder.id)}</strong> is confirmed.</p><p>We will send shipping updates to this email address.</p>`);
  response.json({ preorder: serializePreorder(preorder) });
}));

app.use((_request, response) => response.status(404).json({ error: "Not found" }));
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error); const message = error instanceof Error ? error.message : "Unknown error";
  response.status(/is not configured/.test(message) ? 503 : 500).json({ error: /is not configured/.test(message) ? "Service configuration is incomplete" : "An unexpected error occurred" });
});

export default app;
