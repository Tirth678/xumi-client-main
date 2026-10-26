import { afterEach, describe, expect, it, vi } from "vitest";
import { createPreorder, getActivePreorder, getPreorders, type Preorder } from "@/lib/preorders";

const preorder: Preorder = {
  id: "XM-ABC123", productId: "xumi", productName: "XUMI", price: 3999, quantity: 1,
  totalAmount: 3999, currency: "INR", customerName: "Alex Rider", email: "alex@example.com",
  phone: "+91 98765 43210", address: { line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
  status: "received", paymentUrl: null, bookingExpiresAt: null, paidAt: null,
  createdAt: "2026-10-26T00:00:00.000Z", updatedAt: "2026-10-26T00:00:00.000Z",
};

describe("preorder API", () => {
  afterEach(() => vi.restoreAllMocks());

  it("creates an authenticated preorder", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ preorder }), { status: 201, headers: { "Content-Type": "application/json" } }));
    await expect(createPreorder({ customerName: preorder.customerName, phone: preorder.phone, address: preorder.address }, "jwt")).resolves.toEqual(preorder);
    expect(fetchMock).toHaveBeenCalledWith("/api/preorders", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer jwt" }) }));
  });

  it("loads preorders from the backend", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ preorders: [preorder] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    await expect(getPreorders("jwt")).resolves.toEqual([preorder]);
  });

  it("selects the active order before an expired one", () => {
    expect(getActivePreorder([{ ...preorder, status: "expired" }, preorder])).toEqual(preorder);
  });
});
