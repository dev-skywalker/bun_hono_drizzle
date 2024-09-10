import { z } from "zod";

export const transferItemSchema = z.object({
    quantity: z.number(),
    productPrice: z.number(),
    subTotal: z.number(),
    productId: z.number(),
    transferId: z.number()
});
