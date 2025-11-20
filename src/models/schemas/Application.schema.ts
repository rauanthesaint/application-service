import z from "zod";
import { IdSchema, DateSchema } from "./base.schema";
import { LoadPublicSchema, LoadSchemaDTO } from "./Load.schema";
import { PaymentPublicSchema, PaymentSchemaDTO } from "./Payment.schema";
import { TransportPublicSchema, TransportSchemaDTO } from "./Transport.schema";

const StatusSchema = z.enum(["draft", "active", "cancelled", "archived"]);

const User = z.object({
    first_name: z.string().min(1).max(50),
    last_name: z.string().min(1).max(50),
});

const Organization = z.object({
    uin: z.string().max(20),
    name: z.string().min(1).max(50),
});

export const ApplicationGeneralSchema = z.object({
    user_id: IdSchema,
    organization_id: IdSchema.nullable(),
    phone: z.string().regex(/^\+?\d{10,15}$/),
    comment: z.string().nullable(),
    status: StatusSchema.default("draft"),
});

export const ApplicationDTOSchema = ApplicationGeneralSchema.extend({
    status: StatusSchema.default("draft"),
    load: LoadSchemaDTO.omit({ application_id: true }),
    payment: PaymentSchemaDTO.omit({ application_id: true }),
    transport: TransportSchemaDTO.omit({ application_id: true }),
});

export const ApplicationSchema = ApplicationGeneralSchema.extend({
    id: IdSchema,
    created_at: DateSchema,
    updated_at: DateSchema,
    updated_by: IdSchema.nullable(),
});

export const ApplicationPublicSchema = ApplicationSchema.extend({
    user: User,
    organization: Organization.nullable(),
    phone: z.string().regex(/^\+?\d{10,15}$/),
    comment: z.string().nullable(),
    status: StatusSchema.default("draft"),
    load: LoadPublicSchema,
    payment: PaymentPublicSchema,
    transport: TransportPublicSchema,
}).omit({ user_id: true, organization_id: true });
