import { z } from "zod";

export const manageStockSchema = z.object({
    quantity: z.number(),
    alert: z.number(),
    productId: z.number(),
    warehouseId: z.number()
});
