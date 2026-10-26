import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DuneHaulFooter from "./dune-haul-footer";

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
  vi.restoreAllMocks();
});

describe("DuneHaulFooter", () => {
  it("uses the supplied brand and real navigation destinations", () => {
    render(<DuneHaulFooter name="RoboCraft" brandHref="/" columns={[
      { title: "XUMI", links: [{ label: "Pre-order", href: "/preorder" }] },
    ]} socials={[]} />);
    expect(screen.getByRole("link", { name: "RoboCraft" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Pre-order" })).toHaveAttribute("href", "/preorder");
    expect(screen.queryByRole("link", { name: "Facebook" })).not.toBeInTheDocument();
  });

  it("follows theme changes while an explicit preset stays fixed", async () => {
    const { container, rerender } = render(<DuneHaulFooter socials={[]} />);
    expect(container.querySelector("footer")).not.toHaveClass("dhf-night");
    await act(async () => { document.documentElement.classList.add("dark"); });
    expect(container.querySelector("footer")).toHaveClass("dhf-night");
    expect(container.querySelectorAll(".dhf-stars i")).toHaveLength(70);
    rerender(<DuneHaulFooter preset="sage" socials={[]} />);
    expect(container.querySelector("footer")).not.toHaveClass("dhf-night");
  });

  it("parks the truck under reduced motion and allows a silent honk", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: true, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(),
      removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    let nextFrame: FrameRequestCallback = () => {};
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => { nextFrame = cb; return 1; });
    const { container } = render(<DuneHaulFooter sound={false} socials={[]} />);
    act(() => nextFrame(performance.now()));
    const truck = container.querySelector(".dhf-layer-ground g[style]");
    const position = truck?.getAttribute("transform");
    expect(position).toMatch(/^translate\(/);
    act(() => nextFrame(performance.now() + 1000));
    expect(truck?.getAttribute("transform")).toBe(position);
    const bubble = container.querySelector(".dhf-bubble")!;
    const animate = vi.fn();
    Object.defineProperty(bubble, "animate", { value: animate });
    Object.defineProperty(bubble, "getAnimations", { value: () => [] });
    fireEvent.click(container.querySelector(".dhf-hit")!);
    expect(animate).toHaveBeenCalledOnce();
    expect(animate.mock.calls[0][0].every((frame: Keyframe) => !frame.transform)).toBe(true);
  });
});
