import { beforeEach, describe, expect, it } from "vitest";

import { createPreorder, getPreorderFor, subscribeToPreorders } from "@/lib/preorders";

const input = {
  customerName: "  Alex Rider ",
  email: "Alex@Example.com ",
  phone: " +91 98765 43210 ",
  address: {
    line1: " 12 MG Road ",
    city: " Bengaluru ",
    state: " Karnataka ",
    pincode: " 560001 ",
  },
};

describe("preorders", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores a pre-order as pending with trimmed details", () => {
    const preorder = createPreorder(input);

    expect(preorder.id).toMatch(/^XM-[A-Z0-9]{8}$/);
    expect(preorder.status).toBe("pending");
    expect(preorder.productId).toBe("xumi");
    expect(preorder.productName).toBe("XUMI");
    expect(preorder.quantity).toBe(1);
    expect(preorder.email).toBe("alex@example.com");
    expect(preorder.customerName).toBe("Alex Rider");
    expect(preorder.address.city).toBe("Bengaluru");
  });

  it("finds the pre-order regardless of email casing", () => {
    const created = createPreorder(input);

    expect(getPreorderFor("ALEX@example.com")?.id).toBe(created.id);
    expect(getPreorderFor("someone-else@example.com")).toBeNull();
  });

  it("keeps a single place in the queue per customer", () => {
    const first = createPreorder(input);
    const second = createPreorder({ ...input, customerName: "Alex R" });

    expect(second.id).toBe(first.id);
    expect(getPreorderFor(input.email)?.customerName).toBe("Alex Rider");
  });

  it("notifies listeners when a pre-order is created", () => {
    let notifications = 0;
    const unsubscribe = subscribeToPreorders(() => {
      notifications += 1;
    });

    createPreorder(input);
    unsubscribe();

    expect(notifications).toBe(1);
  });
});
