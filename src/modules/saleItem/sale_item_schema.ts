import { z } from "zod";

export const saleItemSchema = z.object({
    quantity: z.number(),
    productPrice: z.number(),
    subTotal: z.number(),
    productId: z.number(),
    saleId: z.number()
});
