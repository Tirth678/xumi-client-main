import { XUMI } from "@/data/productCatalog";

export type PreorderStatus = "pending" | "confirmed";

export interface PreorderAddress {
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Preorder {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  customerName: string;
  email: string;
  phone: string;
  address: PreorderAddress;
  /** `pending` = reserved, waiting for RoboCraft to confirm. `confirmed` = locked in. */
  status: PreorderStatus;
  createdAt: string;
}

export interface PreorderInput {
  customerName: string;
  email: string;
  phone: string;
  address: PreorderAddress;
}

/**
 * Pre-orders are kept in the browser for now so the launch flow works without a
 * backend. Every read/write goes through this module, so swapping it for the
 * real `/api/preorders` calls later is a change in one file.
 */
const STORAGE_KEY = "xumi-preorders";
const PREORDER_EVENT = "xumi-preorders-changed";

const isPreorder = (value: unknown): value is Preorder => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Preorder>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.createdAt === "string" &&
    (candidate.status === "pending" || candidate.status === "confirmed")
  );
};

const readAll = (): Preorder[] => {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isPreorder) : [];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

const writeAll = (preorders: Preorder[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preorders));
  window.dispatchEvent(new Event(PREORDER_EVENT));
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const createPreorderId = () => {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const random = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `XM-${stamp}${random}`;
};

/** The signed-in customer's pre-order, or `null` if they have not ordered yet. */
export const getPreorderFor = (email: string): Preorder | null => {
  const target = normalizeEmail(email);
  const match = readAll()
    .filter((preorder) => normalizeEmail(preorder.email) === target)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return match ?? null;
};

/** A customer can hold one place in the pre-order queue at a time. */
export const createPreorder = (input: PreorderInput): Preorder => {
  const email = normalizeEmail(input.email);
  const existing = getPreorderFor(email);

  if (existing) {
    return existing;
  }

  const preorder: Preorder = {
    id: createPreorderId(),
    productId: XUMI.id,
    productName: XUMI.name,
    price: XUMI.price,
    quantity: 1,
    customerName: input.customerName.trim(),
    email,
    phone: input.phone.trim(),
    address: {
      line1: input.address.line1.trim(),
      city: input.address.city.trim(),
      state: input.address.state.trim(),
      pincode: input.address.pincode.trim(),
    },
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  writeAll([...readAll(), preorder]);
  return preorder;
};

export const subscribeToPreorders = (callback: () => void) => {
  window.addEventListener(PREORDER_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(PREORDER_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};
