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

export type TransportPublic = z.infer<typeof TransportPublicSchema>;
export type Transport = z.infer<typeof TransportSchema>;
export type TransportDTO = z.infer<typeof TransportSchemaDTO>;
export type TransportType = z.infer<typeof TransportTypeSchema>;
