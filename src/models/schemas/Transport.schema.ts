import z from "zod";
import { DateSchema, IdSchema } from "./base.schema";

export const TransportSchemaDTO = z.object({
    application_id: IdSchema,
    type_id: IdSchema,
    count: z.number().int().positive(),
});

export const TransportSchema = TransportSchemaDTO.extend({
    id: IdSchema,
    created_at: DateSchema,
    updated_at: DateSchema,
});

export const TransportTypeSchema = z.object({
    id: IdSchema,
    name: z.string(),
});

export const TransportPublicSchema = TransportSchema.extend({
    type: TransportTypeSchema,
}).omit({ type_id: true, application_id: true });
