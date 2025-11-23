import z from "zod";
import { DateSchema, IdSchema, Organization, User } from "./base.schema";

export const BidStatusSchema = z.enum(["pending", "rejected", "accepted"]);

export const BidDTOSchema = z.object({
    application_id: IdSchema,
    user_id: IdSchema,
    organization_id: IdSchema.nullable(),
});

export const BidSchema = BidDTOSchema.extend({
    id: IdSchema,
    created_at: DateSchema,
    updated_at: DateSchema,
    status: BidStatusSchema.default("pending"),
    updated_by_id: IdSchema.nullable(),
});

export const BidPublicSchema = BidSchema.extend({
    updated_by: User.nullable(),
    from: z.object({
        user: User,
        organization: Organization.nullable(),
    }),
}).omit({ updated_by_id: true, user_id: true, organization_id: true });
