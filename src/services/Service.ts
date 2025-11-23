import {
    Application,
    ApplicationDTO,
    ApplicationPublic,
    ApplicationFilters,
    LoadType,
    PaymentCondition,
    PaymentMethod,
    TransportType,
    BidPublic,
    BidDTO,
    BidStatus,
} from "@/models";
import { ApplicationDTOSchema, BidDTOSchema, BidStatusSchema, IdSchema } from "@/models/schemas";
import { IRepository } from "@/repositories/Repository.interface";
import { FastifyBaseLogger } from "fastify";
import createHttpError from "http-errors";
import z from "zod";

export class Service {
    constructor(private repository: IRepository, private options?: { logger: FastifyBaseLogger }) {}

    async getApplicationById(id: number): Promise<ApplicationPublic> {
        const { success, data, error } = IdSchema.safeParse(id);
        if (!success) {
            this.options?.logger.error(`Invalid data. Error: ${error}`);
            throw new createHttpError[400]("Invalid data");
        }

        const result = await this.repository.getApplicationById(data);
        if (!result) {
            this.options?.logger.error(`Application is not found. ID: ${data}`);
            throw new createHttpError[404]("Application is not found");
        }

        return result;
    }

    async getLoadTypes(): Promise<LoadType[]> {
        const result = await this.repository.getLoadTypes();
        if (result.length === 0) {
            this.options?.logger.error("Load Types not found");
            throw new createHttpError[404]("Load Types not found");
        }
        return result;
    }
    async getTransportTypes(): Promise<TransportType[]> {
        const result = await this.repository.getTransportTypes();
        if (result.length === 0) {
            this.options?.logger.error("Transport Types not found");
            throw new createHttpError[404]("Transport Types not found");
        }
        return result;
    }
    async getPaymentMethods(): Promise<PaymentMethod[]> {
        const result = await this.repository.getPaymentMethods();
        if (result.length === 0) {
            this.options?.logger.error("Method Types not found");
            throw new createHttpError[404]("Method Types not found");
        }
        return result;
    }
    async getPaymentConditions(): Promise<PaymentCondition[]> {
        const result = await this.repository.getPaymentConditions();
        if (result.length === 0) {
            this.options?.logger.error("Conditions Types not found");
            throw new createHttpError[404]("Conditions Types not found");
        }
        return result;
    }

    async createApplication(dto: ApplicationDTO): Promise<ApplicationPublic> {
        const { success, data, error } = ApplicationDTOSchema.safeParse(dto);
        if (!success) {
            this.options?.logger.error(`Invalid data. Error: ${error}`);
            throw new createHttpError[400]("Invalid data");
        }

        const application = await this.repository.createApplication(data);
        return application;
    }

    async deleteApplicationById(id: number): Promise<void> {
        const { data, error, success } = IdSchema.safeParse(id);
        if (!success) {
            this.options?.logger.error(`Invalid data. Error: ${error}`);
            throw new createHttpError[400]("Invalid data");
        }

        const application = this.repository.getApplicationById(data);
        if (!application) {
            this.options?.logger.error(`Application is not found. ID: ${data}`);
            throw new createHttpError[404]("Application is not found");
        }

        const result = await this.repository.deleteApplicationById(data);
        if (!result) {
            this.options?.logger.error(`Deleting application failed. ID: ${data}`);
            throw new createHttpError[404]("Application is not found");
        }
    }

    async getApplications(filters: ApplicationFilters): Promise<ApplicationPublic[]> {
        const result = await this.repository.getApplications(filters);
        return result;
    }

    async createBid(dto: BidDTO): Promise<BidPublic> {
        const { success, data, error } = BidDTOSchema.safeParse(dto);
        if (!success) {
            this.options?.logger.error(`Invalid data. Error: ${error}`);
            throw new createHttpError[400]("Invalid data");
        }

        const result = await this.repository.createBid(data);
        return result;
    }

    async getBidById(id: number): Promise<BidPublic> {
        const { success, data, error } = IdSchema.safeParse(id);
        if (!success) {
            this.options?.logger.error(`Invalid data. Error: ${error}`);
            throw new createHttpError[400]("Invalid data");
        }

        const result = await this.repository.getBidById(data);
        if (!result) {
            this.options?.logger.error(`Bid is not found. ID: ${data}`);
            throw new createHttpError[404]("Bid is not found");
        }

        return result;
    }

    async updateBidStatus(id: number, status: BidStatus, updated_by: number): Promise<BidPublic> {
        const { success, error, data } = z
            .object({
                id: IdSchema,
                status: BidStatusSchema,
                updated_by: IdSchema,
            })
            .safeParse({ id, status });

        if (!success) {
            this.options?.logger.error(`Invalid data. Error: ${error}`);
            throw new createHttpError[400]("Invalid data");
        }

        const bid = await this.repository.getBidById(id);
        if (!bid) {
            this.options?.logger.error(`Bid is not found. ID: ${data}`);
            throw new createHttpError[404]("Bid is not found");
        }

        return await this.repository.updateBidStatus(data.id, data.status, data.updated_by);
    }

    async getBidsApplicationId(id: number): Promise<BidPublic[]> {
        const { success, data, error } = IdSchema.safeParse(id);
        if (!success) {
            this.options?.logger.error(`Invalid data. Error: ${error}`);
            throw new createHttpError[400]("Invalid data");
        }
        return await this.repository.getBidsApplicationId(data);
    }
}
