import { z } from "zod";

export const createPreorderSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(5).max(30),
  quantity: z.coerce.number().int().min(1).max(10).optional().default(1),
  edition: z.enum(["Default", "Customized"]).default("Default"),
  customization: z.string().trim().max(2000).optional(),
  address: z.object({
    line1: z.string().trim().min(2).max(200),
    city: z.string().trim().min(1).max(80),
    state: z.string().trim().min(1).max(80),
    pincode: z.string().trim().min(2).max(20),
  }),
}).superRefine((data, ctx) => {
  if (data.edition === "Customized" && !data.customization) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customization"], message: "Customization instructions are required" });
  }
}).transform((data) => ({ ...data, customization: data.edition === "Customized" ? data.customization! : null }));
