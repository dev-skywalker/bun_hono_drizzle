import { z } from "zod";

export const productSchema = z.object({
    name: z.string(),
    barcode: z.string().optional(),
    description: z.string().optional(),
    tabletOnCard: z.number().optional(),
    cardOnBox: z.number().optional(),
    isLocalProduct: z.boolean().default(false),
    unitId: z.number(),
    brandId: z.number(),
    imageUrl: z.string().default('')
});
