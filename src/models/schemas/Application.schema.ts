import z from "zod";
import { IdSchema, DateSchema, User, Organization } from "./base.schema";
import { LoadPublicSchema, LoadSchemaDTO } from "./Load.schema";
import { PaymentPublicSchema, PaymentSchemaDTO } from "./Payment.schema";
import { TransportPublicSchema, TransportSchemaDTO } from "./Transport.schema";

const StatusSchema = z.enum(["draft", "active", "cancelled", "archived"]);

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

export const ApplicationFiltersSchema = z
    .object({
        status: StatusSchema,
        user_id: IdSchema,
        organization_id: IdSchema,
        page: z.coerce.number().positive(),
        limit: z.coerce.number().positive().max(100),
    })
    .partial();
