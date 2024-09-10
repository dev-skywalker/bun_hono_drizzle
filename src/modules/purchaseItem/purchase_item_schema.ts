import { z } from "zod";

export const purchaseItemSchema = z.object({
    quantity: z.number(),
    subTotal: z.number(),
    productId: z.number(),
    purchaseId: z.number()
});
