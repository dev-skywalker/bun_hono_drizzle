import { z } from "zod";

export const warehouseSchema = z.object({
    name: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
});
