import { authorizedFetch, parseJsonResponse } from "@/lib/authorizedFetch";

export type PreorderStatus = "received" | "payment_pending" | "paid" | "expired" | "cancelled";
export interface PreorderAddress { line1: string; city: string; state: string; pincode: string }
export interface Preorder {
  edition?: string; customization?: string | null;
  confirmationEmailStatus?: "accepted" | "failed";
  id: string; productId: string; productName: string; price: number; quantity: number;
  totalAmount: number; currency: string; customerName: string; email: string; phone: string;
  address: PreorderAddress; status: PreorderStatus; paymentUrl: string | null;
  bookingExpiresAt: string | null; paidAt: string | null; createdAt: string; updatedAt: string;
}
export interface PreorderInput {
  customerName: string;
  phone: string;
  quantity?: number;
  edition?: "Default" | "Customized";
  customization?: string;
  address: PreorderAddress;
}

const apiBase = (import.meta.env.VITE_BACKEND_URL ?? "").replace(/\/$/, "");
export const getPreorders = async (token: string): Promise<Preorder[]> => {
  const response = await authorizedFetch(`${apiBase}/api/preorders`, token);
  return (await parseJsonResponse<{ preorders: Preorder[] }>(response)).preorders;
};
export const getActivePreorder = (preorders: Preorder[]) =>
  preorders.find((preorder) => !["expired", "cancelled"].includes(preorder.status)) ?? preorders[0] ?? null;
export const createPreorder = async (input: PreorderInput, token: string): Promise<Preorder> => {
  const response = await authorizedFetch(`${apiBase}/api/preorders`, token, { method: "POST", body: JSON.stringify(input) });
  const result = await parseJsonResponse<{ preorder: Preorder; confirmationEmailStatus?: "accepted" | "failed" }>(response);
  return result.confirmationEmailStatus
    ? { ...result.preorder, confirmationEmailStatus: result.confirmationEmailStatus }
    : result.preorder;
};
