import { z } from "zod";

export const saleSchema = z.object({
    date: z.number(),
    status: z.number(),
    amount: z.number(),
    note: z.string().optional(),
    shipping: z.number(),
    warehouseId: z.number(),
    supplierId: z.number(),
    userId: z.number(),
});
