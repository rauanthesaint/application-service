import z from "zod";
import { DateSchema, IdSchema } from "./base.schema";

const CoLoadingSchema = z.enum(["no_load", "co_load", "take_load"]);
const LoadParameter = z.coerce.number().positive();

export const LoadSchemaDTO = z.object({
    application_id: IdSchema,
    type_id: IdSchema,
    weight: LoadParameter,
    length: LoadParameter,
    height: LoadParameter,
    width: LoadParameter,
    volume: LoadParameter,
    co_loading: CoLoadingSchema,
});

export const LoadSchema = LoadSchemaDTO.extend({
    id: IdSchema,
    created_at: DateSchema,
    updated_at: DateSchema,
});

export const LoadTypeSchema = z.object({
    id: IdSchema,
    name: z.string(),
});

export const LoadPublicSchema = LoadSchema.extend({
    type: LoadTypeSchema,
}).omit({ type_id: true, application_id: true });
