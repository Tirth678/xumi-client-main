import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import AccountPage from "./AccountPage";
import type { Preorder } from "@/lib/preorders";

const auth = vi.hoisted(() => ({
  current: {
    user: { id: "alex@example.com", email: "alex@example.com", firstName: "Alex", role: "user" },
    token: "token",
    isAuthenticated: true,
    isLoading: false,
    logout: () => {},
  } as {
    user: { id: string; email: string; firstName?: string; role: string } | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth.current,
}));

const preorderApi = vi.hoisted(() => ({ getPreorders: vi.fn() }));
vi.mock("@/lib/preorders", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/preorders")>();
  return { ...original, getPreorders: preorderApi.getPreorders };
});

const preorder: Preorder = {
  id: "XM-ABC123",
  productId: "xumi",
  productName: "XUMI",
  price: 3999,
  quantity: 1,
  totalAmount: 3999,
  currency: "INR",
  customerName: "Alex Rider",
  email: "alex@example.com",
  phone: "+91 98765 43210",
  address: { line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
  status: "received",
  paymentUrl: null,
  bookingExpiresAt: null,
  paidAt: null,
  createdAt: "2026-10-26T00:00:00.000Z",
  updatedAt: "2026-10-26T00:00:00.000Z",
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>,
  );

describe("AccountPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    auth.current.isAuthenticated = true;
    auth.current.token = "token";
    auth.current.user = {
      id: "alex@example.com",
      email: "alex@example.com",
      firstName: "Alex",
      role: "user",
    };
    preorderApi.getPreorders.mockResolvedValue([]);
  });

  it("asks for a sign in when the visitor is signed out", () => {
    auth.current.isAuthenticated = false;
    auth.current.user = null;
    auth.current.token = null;

    renderPage();

    expect(screen.getByText("Sign in to see your order")).toBeInTheDocument();
  });

  it("shows an empty state before the customer pre-orders", async () => {
    renderPage();

    expect(await screen.findByText("No pre-order yet")).toBeInTheDocument();
  });

  it("shows an under-review status for a freshly placed pre-order", async () => {
    preorderApi.getPreorders.mockResolvedValue([preorder]);
    renderPage();

    expect(await screen.findByText("Under review")).toBeInTheDocument();
    expect(screen.queryByText("Payment confirmed")).not.toBeInTheDocument();
    expect(screen.getByText(/payment link that stays valid for 15 days/i)).toBeInTheDocument();
    expect(screen.getAllByText(/alex@example\.com/).length).toBeGreaterThan(0);
  });

  it("shows the saved customization instructions", async () => {
    preorderApi.getPreorders.mockResolvedValue([{ ...preorder, productName: "XUMI (Customized)", edition: "Customized", customization: "Blue shell with white eyes" }]);
    renderPage();
    expect(await screen.findByText("Customization instructions")).toBeInTheDocument();
    expect(screen.getByText("Blue shell with white eyes")).toBeInTheDocument();
  });

  it("shows a confirmed status once payment is verified", async () => {
    preorderApi.getPreorders.mockResolvedValue([{ ...preorder, status: "paid", paidAt: "2026-10-27T00:00:00.000Z" }]);
    renderPage();

    expect(await screen.findByText("Payment confirmed")).toBeInTheDocument();
    expect(screen.queryByText("Under review")).not.toBeInTheDocument();
    expect(screen.getByText(/payment and XUMI booking are confirmed/i)).toBeInTheDocument();
  });
});
