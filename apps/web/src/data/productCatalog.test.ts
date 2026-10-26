import { describe, expect, it } from "vitest";

import {
  XUMI,
  XUMI_DISCOUNT_PERCENT,
  XUMI_FEATURES,
  XUMI_GALLERY,
  XUMI_MRP_LABEL,
  XUMI_PRICE_LABEL,
} from "@/data/productCatalog";

describe("productCatalog", () => {
  it("describes exactly one pre-order product", () => {
    expect(XUMI.id).toBe("xumi");
    expect(XUMI.name).toBe("XUMI");
    expect(XUMI.tagline).toBe("Your personal tiny desk partner");
  });

  it("keeps the pre-order price below the MRP with a matching label", () => {
    expect(XUMI.price).toBeLessThan(XUMI.originalPrice);
    expect(XUMI_PRICE_LABEL).toBe(`₹${XUMI.price}`);
    expect(XUMI_MRP_LABEL).toBe(`₹${XUMI.originalPrice}`);
    expect(XUMI_DISCOUNT_PERCENT).toBe(20);
  });

  it("exposes a gallery and a feature list for the landing page", () => {
    expect(XUMI_GALLERY.length).toBeGreaterThan(1);
    expect(XUMI_GALLERY.every(Boolean)).toBe(true);
    expect(XUMI_FEATURES.length).toBeGreaterThan(0);
  });
});
