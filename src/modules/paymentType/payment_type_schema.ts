import { z } from "zod";

export const paymentTypeSchema = z.object({
    name: z.string(),
});
