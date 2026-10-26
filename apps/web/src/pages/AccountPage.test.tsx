import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import AccountPage from "./AccountPage";
import { createPreorder } from "@/lib/preorders";

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

const preorderInput = {
  customerName: "Alex Rider",
  email: "alex@example.com",
  phone: "+91 98765 43210",
  address: { line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
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
    auth.current.user = {
      id: "alex@example.com",
      email: "alex@example.com",
      firstName: "Alex",
      role: "user",
    };
  });

  it("asks for a sign in when the visitor is signed out", () => {
    auth.current.isAuthenticated = false;
    auth.current.user = null;

    renderPage();

    expect(screen.getByText("Sign in to see your order")).toBeInTheDocument();
  });

  it("shows an empty state before the customer pre-orders", () => {
    renderPage();

    expect(screen.getByText("No pre-order yet")).toBeInTheDocument();
  });

  it("shows a pending status for a freshly placed pre-order", () => {
    createPreorder(preorderInput);

    renderPage();

    expect(screen.getByText("Awaiting confirmation")).toBeInTheDocument();
    expect(screen.queryByText("Order confirmed")).not.toBeInTheDocument();
    expect(screen.getByText(/confirming pre-orders in the order they came in/i)).toBeInTheDocument();
    expect(screen.getAllByText(/alex@example\.com/).length).toBeGreaterThan(0);
  });

  it("shows a confirmed status once RoboCraft confirms the pre-order", () => {
    const preorder = createPreorder(preorderInput);
    window.localStorage.setItem(
      "xumi-preorders",
      JSON.stringify([{ ...preorder, status: "confirmed" }]),
    );

    renderPage();

    expect(screen.getByText("Order confirmed")).toBeInTheDocument();
    expect(screen.queryByText("Awaiting confirmation")).not.toBeInTheDocument();
    expect(screen.getByText(/Your XUMI is confirmed/i)).toBeInTheDocument();
  });
});
