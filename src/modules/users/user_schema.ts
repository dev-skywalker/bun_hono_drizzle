import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email(),
    password: z
        .string()
        .min(8)
        .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
            message:
                "Minimum eight characters, at least one letter, one number and one special character",
        }),
});

export const registrationSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
        message: "Minimum eight characters, at least one letter, one number and one special character",
    }),
    role: z.string().min(1),
    isActive: z.boolean()
});