import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PreorderPage from "./PreorderPage";
import { createPreorder, getPreorders } from "@/lib/preorders";
import { toast } from "sonner";

const auth = vi.hoisted(() => ({
  user: { email: "buyer@example.com", firstName: "Test", lastName: "Buyer" },
  token: "token", isAuthenticated: true, isLoading: false,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/lib/neonAuth", () => ({ loginWithGoogle: vi.fn(), refreshAccessToken: vi.fn() }));
vi.mock("@/lib/preorders", () => ({ createPreorder: vi.fn(), getPreorders: vi.fn(), getActivePreorder: () => null }));
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/FooterSection", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(getPreorders).mockResolvedValue([]);
  vi.mocked(createPreorder).mockResolvedValue({ confirmationEmailStatus: "failed" } as Awaited<ReturnType<typeof createPreorder>>);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

async function setup() {
  render(<MemoryRouter><PreorderPage /></MemoryRouter>);
  await screen.findByRole("button", { name: /Reserve 1 Unit/ });
  for (const [label, value] of [
    ["Full name", "Test Buyer"], ["Contact phone", "9876543210"],
    ["Street address / Flat No.", "12 Test Street"], ["City", "Pune"],
    ["State", "Maharashtra"], ["PIN code", "411001"],
  ]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("pre-order variants", () => {
  it("offers two variants, requires customization text, and submits it with the order", async () => {
    await setup();
    expect(screen.getByRole("button", { name: /Default Original/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Cyber Slate")).not.toBeInTheDocument();
    expect(screen.queryByText("Midnight Obsidian")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/How would you like/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Customized Tell us/ }));
    fireEvent.click(screen.getByRole("button", { name: /Reserve 1 Unit/ }));
    expect(await screen.findByText("Please describe how you want your XUMI customized")).toBeInTheDocument();
    expect(createPreorder).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/How would you like/), { target: { value: "Blue shell with white eyes" } });
    fireEvent.click(screen.getByRole("button", { name: /Reserve 1 Unit/ }));
    await waitFor(() => expect(createPreorder).toHaveBeenCalledWith(expect.objectContaining({ edition: "Customized", customization: "Blue shell with white eyes" }), "token"));
    expect(toast.success).toHaveBeenCalledWith("Pre-order placed!", expect.objectContaining({ description: expect.stringContaining("couldn’t send") }));
  });

  it("does not submit hidden customization when switching back to Default", async () => {
    await setup();
    fireEvent.click(screen.getByRole("button", { name: /Customized Tell us/ }));
    fireEvent.change(screen.getByLabelText(/How would you like/), { target: { value: "Blue shell" } });
    fireEvent.click(screen.getByRole("button", { name: /Default Original/ }));
    expect(screen.queryByLabelText(/How would you like/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Reserve 1 Unit/ }));
    await waitFor(() => expect(createPreorder).toHaveBeenCalledWith(expect.objectContaining({ edition: "Default", customization: undefined }), "token"));
  });
});
