import z from "zod";
import {
    LoadTypeSchema,
    ApplicationDTOSchema,
    ApplicationSchema,
    LoadPublicSchema,
    PaymentPublicSchema,
    PaymentSchemaDTO,
    PaymentSchema,
    LoadSchemaDTO,
    LoadSchema,
    TransportPublicSchema,
    TransportTypeSchema,
    TransportSchemaDTO,
    TransportSchema,
    ApplicationPublicSchema,
    ApplicationGeneralSchema,
    PaymentConditionSchema,
    PaymentMethodSchema,
    ApplicationFiltersSchema,
    BidDTOSchema,
    BidSchema,
    BidPublicSchema,
    BidStatusSchema,
} from "./schemas";

export type ApplicationDTO = z.infer<typeof ApplicationDTOSchema>;
export type Application = z.infer<typeof ApplicationSchema>;
export type ApplicationPublic = z.infer<typeof ApplicationPublicSchema>;
export type ApplicationGeneral = z.infer<typeof ApplicationGeneralSchema>;

export type LoadType = z.infer<typeof LoadTypeSchema>;
export type LoadDTO = z.infer<typeof LoadSchemaDTO>;
export type LoadPublic = z.infer<typeof LoadPublicSchema>;
export type Load = z.infer<typeof LoadSchema>;

export type PaymentPublic = z.infer<typeof PaymentPublicSchema>;
export type PaymentDTO = z.infer<typeof PaymentSchemaDTO>;
export type Payment = z.infer<typeof PaymentSchema>;
export type PaymentCondition = z.infer<typeof PaymentConditionSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export type TransportPublic = z.infer<typeof TransportPublicSchema>;
export type Transport = z.infer<typeof TransportSchema>;
export type TransportDTO = z.infer<typeof TransportSchemaDTO>;
export type TransportType = z.infer<typeof TransportTypeSchema>;

export type ApplicationFilters = z.infer<typeof ApplicationFiltersSchema>;

export type BidDTO = z.infer<typeof BidDTOSchema>;
export type Bid = z.infer<typeof BidSchema>;
export type BidPublic = z.infer<typeof BidPublicSchema>;
export type BidStatus = z.infer<typeof BidStatusSchema>;
