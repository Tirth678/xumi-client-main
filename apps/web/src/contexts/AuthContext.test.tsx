import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { clearStoredAuth, setStoredAuth } from "@/lib/auth";
import { syncNeonSession } from "@/lib/neonAuth";

vi.mock("@/lib/neonAuth", () => ({
  syncNeonSession: vi.fn(),
  refreshAccessToken: vi.fn(),
  logout: vi.fn(),
}));

const session = { email: "buyer@example.com", accessToken: "test.jwt.token", refreshToken: "", firstName: "Buyer" };

function SessionView() {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  return <div>{isLoading ? "Loading" : isAuthenticated ? `${user?.email} ${token}` : "Sign in to pre-order"}</div>;
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(syncNeonSession).mockReset().mockResolvedValue(null);
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("AuthProvider", () => {
  it("updates the signed-in view after OAuth without reloading or restarting the provider", async () => {
    window.history.replaceState({}, "", "/auth/callback");
    render(<AuthProvider><SessionView /></AuthProvider>);
    expect(syncNeonSession).not.toHaveBeenCalled();
    expect(screen.getByText("Sign in to pre-order")).toBeInTheDocument();
    act(() => {
      setStoredAuth(session);
      window.history.replaceState({}, "", "/preorder");
    });
    expect(await screen.findByText(`${session.email} ${session.accessToken}`)).toBeInTheDocument();
    act(() => clearStoredAuth());
    expect(screen.getByText("Sign in to pre-order")).toBeInTheDocument();
  });

  it("continues subscribing after normal session restoration and email login", async () => {
    window.history.replaceState({}, "", "/login");
    render(<AuthProvider><SessionView /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("Sign in to pre-order")).toBeInTheDocument());
    expect(syncNeonSession).toHaveBeenCalledOnce();
    act(() => setStoredAuth(session));
    expect(await screen.findByText(`${session.email} ${session.accessToken}`)).toBeInTheDocument();
  });
});
