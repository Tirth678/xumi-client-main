import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FeaturesSection from "./FeaturesSection";
import { XUMI_FEATURES, XUMI_GALLERY } from "@/data/productCatalog";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("FeaturesSection", () => {
  it("switches all six feature images and preserves the additional feature", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.stubGlobal("IntersectionObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    render(<FeaturesSection />);
    expect(screen.getAllByRole("button")).toHaveLength(6);
    expect(screen.getByText(/Also includes RoboLink Messaging/)).toBeInTheDocument();
    for (let index = 0; index < 6; index += 1) {
      const button = screen.getByRole("button", { name: XUMI_FEATURES[index] });
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(screen.getAllByRole("button").filter((item) => item.getAttribute("aria-pressed") === "true")).toHaveLength(1);
      await waitFor(() => {
        const images = screen.getAllByAltText(`XUMI — ${XUMI_FEATURES[index]}`);
        expect(images).toHaveLength(2);
        images.forEach((image) => expect(image).toHaveAttribute("src", XUMI_GALLERY[index]));
      });
    }
  });
});
