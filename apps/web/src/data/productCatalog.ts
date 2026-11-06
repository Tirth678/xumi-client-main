// Use WebP images for 70-80% smaller file sizes
import xumiDesk from "@/assets/xumi/xumi-desk.webp";
import xumiHappy from "@/assets/xumi/xumi-happy.webp";
import xumiCozy from "@/assets/xumi/xumi-cozy.webp";
import xumiDizzy from "@/assets/xumi/xumi-dizzy.webp";
import xumiLove from "@/assets/xumi/xumi-love.webp";
import xumiAngry from "@/assets/xumi/xumi-angry.webp";

/**
 * XUMI is the only product this storefront sells. The company is still
 * RoboCraft; XUMI is the launch product that is taking pre-orders.
 */
export const XUMI = {
  id: "xumi",
  name: "XUMI",
  tagline: "Your personal tiny desk partner",
  description:
    "XUMI lives on your desk, reacts to your touch and slowly builds his own personality. 40+ expressions, five moods, focus sessions, a clock and little games — calm with a lot of character.",
  price: 1999,
  originalPrice: 3999,
  deliveryCharge: 89,
  currency: "₹",
  shipping: "Free shipping across India",
  shippingNote: "Shipping may take 6–10 days once your pre-order is confirmed",
} as const;

export const XUMI_FEATURES = [
  "40+ Expressions",
  "5 Different Moods",
  "Hyper Casual Games",
  "Clock Mode",
  "Focus Mode",
  "Procedural Animations",
  "RoboLink Messaging",
] as const;

/** Every view of XUMI shown in the product gallery, in display order. */
export const XUMI_GALLERY = [
  xumiDesk,
  xumiHappy,
  xumiCozy,
  xumiDizzy,
  xumiLove,
  xumiAngry,
];

export const XUMI_IMAGE = XUMI_GALLERY[0];

export const XUMI_PRICE_LABEL = `₹${XUMI.price}`;
export const XUMI_MRP_LABEL = `₹${XUMI.originalPrice}`;
export const XUMI_DISCOUNT_PERCENT = Math.round(
  (1 - XUMI.price / XUMI.originalPrice) * 100,
);
