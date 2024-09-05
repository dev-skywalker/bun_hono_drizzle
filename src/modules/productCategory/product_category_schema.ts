import { z } from "zod";

export const productCategorySchema = z.object({
    productId: z.number(),
    categoryId: z.number()
});
