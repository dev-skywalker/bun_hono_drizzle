import { z } from "zod";

export const purchaseSchema = z.object({
    date: z.number(),
    status: z.number(),
    amount: z.number(),
    refCode: z.string().optional(),
    note: z.string().optional(),
    shipping: z.number(),
    warehouseId: z.number(),
    supplierId: z.number(),
});
