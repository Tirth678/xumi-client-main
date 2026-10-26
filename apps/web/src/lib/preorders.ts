import { refreshAccessToken } from "@/lib/neonAuth";

export type PreorderStatus = "received" | "payment_pending" | "paid" | "expired" | "cancelled";
export interface PreorderAddress { line1: string; city: string; state: string; pincode: string }
export interface Preorder {
  id: string; productId: string; productName: string; price: number; quantity: number;
  totalAmount: number; currency: string; customerName: string; email: string; phone: string;
  address: PreorderAddress; status: PreorderStatus; paymentUrl: string | null;
  bookingExpiresAt: string | null; paidAt: string | null; createdAt: string; updatedAt: string;
}
export interface PreorderInput {
  customerName: string;
  phone: string;
  quantity?: number;
  edition?: string;
  address: PreorderAddress;
}

const apiBase = (import.meta.env.VITE_BACKEND_URL ?? "").replace(/\/$/, "");
const parseResponse = async <T>(response: Response): Promise<T> => {
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(body.error || "The request failed. Please try again.");
  return body as T;
};
const authorizedFetch = async (path: string, token: string, init?: RequestInit) => {
  const request = (accessToken: string) => fetch(`${apiBase}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers, Authorization: `Bearer ${accessToken}` },
  });
  let response = await request(token);
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) response = await request(refreshed);
  }
  return response;
};

export const getPreorders = async (token: string): Promise<Preorder[]> => {
  const response = await authorizedFetch("/api/preorders", token);
  return (await parseResponse<{ preorders: Preorder[] }>(response)).preorders;
};
export const getActivePreorder = (preorders: Preorder[]) =>
  preorders.find((preorder) => !["expired", "cancelled"].includes(preorder.status)) ?? preorders[0] ?? null;
export const createPreorder = async (input: PreorderInput, token: string): Promise<Preorder> => {
  const response = await authorizedFetch("/api/preorders", token, { method: "POST", body: JSON.stringify(input) });
  return (await parseResponse<{ preorder: Preorder }>(response)).preorder;
};
