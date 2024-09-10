import { z } from "zod";

export const transferSchema = z.object({
    date: z.number(),
    status: z.number(),
    amount: z.number(),
    note: z.string().optional(),
    shipping: z.number(),
    fromWarehouseId: z.number(),
    toWarehouseId: z.number(),
});
