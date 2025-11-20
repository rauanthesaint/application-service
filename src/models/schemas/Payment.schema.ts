import z from "zod";
import { DateSchema, IdSchema } from "./base.schema";

export const PaymentSchemaDTO = z.object({
    application_id: IdSchema,
    currency_id: IdSchema,
    amount: z.coerce.number().nonnegative(),
    prepayment: z.coerce.number().min(0).max(1).default(0),
    method_id: IdSchema,
    condition_id: IdSchema,
});

export const PaymentSchema = PaymentSchemaDTO.extend({
    id: IdSchema,
    created_at: DateSchema,
    updated_at: DateSchema,
});

export const PaymentMethodSchema = z.object({
    id: IdSchema,
    name: z.string(),
});

export const PaymentConditionSchema = z.object({
    id: IdSchema,
    name: z.string(),
});

export const PaymentPublicSchema = PaymentSchema.extend({
    method: PaymentMethodSchema,
    condition: PaymentConditionSchema,
}).omit({
    method_id: true,
    condition_id: true,
    application_id: true,
});
