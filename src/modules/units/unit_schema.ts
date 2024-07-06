import { z } from "zod";

export const unitSchema = z.object({
    name: z.string()
});
