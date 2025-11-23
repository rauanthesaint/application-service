import z from "zod";

export const IdSchema = z.coerce.number().int().positive();
export const DateSchema = z.coerce.date();
export const User = z.object({
    id: IdSchema,
    first_name: z.string().min(1).max(50),
    last_name: z.string().min(1).max(50),
});

export const Organization = z.object({
    id: IdSchema,
    uin: z.string().max(20),
    name: z.string().min(1).max(50),
});
