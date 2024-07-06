import { z } from "zod";

export const productSchema = z.object({
    name: z.string(),
    barcode: z.string().optional(),
    description: z.string().optional(),
    tabletOnCard: z.string().optional(),
    cardOnBox: z.string().optional(),
    // isLocalProduct: z.boolean().default(false),
    //unitId: z.number()
});
