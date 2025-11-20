import dotenv from "dotenv";
import z from "zod";

export const ENVSchema = z.object({
    PORT: z.coerce.number().positive().min(1000).max(9999).default(5000),
    ENV: z.enum(["production", "development"]).default("development"),
    DATABASE_URL: z.url(),
});

dotenv.config();

const parsed = ENVSchema.safeParse(process.env);
if (!parsed.success) {
    throw new Error(`Invalid env variables: ${parsed.error}`);
}
export const env = parsed.data;
