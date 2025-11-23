import {
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
import { Service } from "@/services/Service";
import { Response } from "@/utils/types";
import { FastifyReply, FastifyRequest } from "fastify";

export class Controller {
    constructor(private service: Service) {}

    async getApplicationById(request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) {
        const application = await this.service.getApplicationById(request.params.id);

        const response: Response<ApplicationPublic> = {
            success: true,
            payload: application,
            message: "Application fetched successfully",
        };

        return reply.status(200).send(response);
    }

    async getLoadTypes(request: FastifyRequest, reply: FastifyReply) {
        const loadTypes = await this.service.getLoadTypes();
        const response: Response<LoadType[]> = {
            success: true,
            payload: loadTypes,
            message: "Load Types fetched successfully",
        };
        return reply.status(200).send(response);
    }

    async getTransportTypes(request: FastifyRequest, reply: FastifyReply) {
        const transportTypes = await this.service.getTransportTypes();
        const response: Response<TransportType[]> = {
            success: true,
            payload: transportTypes,
            message: "Transport Types fetched successfully",
        };
        return reply.status(200).send(response);
    }
    async getPaymentConditionsAndMethods(request: FastifyRequest, reply: FastifyReply) {
        const conditions = await this.service.getPaymentConditions();
        const methods = await this.service.getPaymentMethods();
        const response: Response<{ conditions: PaymentCondition[]; methods: PaymentMethod[] }> = {
            success: true,
            payload: { conditions, methods },
            message: "Load Types fetched successfully",
        };
        return reply.status(200).send(response);
    }

    async getApplications(request: FastifyRequest<{ Querystring: ApplicationFilters }>, reply: FastifyReply) {
        const applications = await this.service.getApplications(request.query);

        const response: Response<{ total: number; applications: ApplicationPublic[] }> = {
            success: true,
            payload: {
                total: applications.length,
                applications,
            },
            message: `${applications.length} application(s) fetched successfully`,
        };
        return reply.send(response);
    }

    async createApplication(request: FastifyRequest<{ Body: ApplicationDTO }>, reply: FastifyReply) {
        const application = await this.service.createApplication(request.body);

        const response: Response<ApplicationPublic> = {
            success: true,
            payload: application,
            message: "Application created successfully",
        };

        return reply.status(201).send(response);
    }

    async deleteApplicationById(request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) {
        await this.service.deleteApplicationById(request.params.id);
        const response: Response<{ is_deleted: boolean }> = {
            success: true,
            message: "Application is deleted",
        };
        return reply.status(200).send(response);
    }

    async getBidById(request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) {
        const result = await this.service.getBidById(request.params.id);
        const response: Response<BidPublic> = {
            success: true,
            payload: result,
            message: "Bid fetched successfully",
        };
        return reply.status(200).send(response);
    }
    async createBid(request: FastifyRequest<{ Body: BidDTO }>, reply: FastifyReply) {
        const result = await this.service.createBid(request.body);
        const response: Response<BidPublic> = {
            success: true,
            payload: result,
            message: "Bid created successfully",
        };
        return reply.status(201).send(response);
    }
    async updateBidStatus(
        request: FastifyRequest<{ Body: { status: BidStatus; updated_by: number }; Params: { id: number } }>,
        reply: FastifyReply
    ) {
        const result = await this.service.updateBidStatus(request.params.id, request.body.status);
        const response: Response<BidPublic> = {
            success: true,
            payload: result,
            message: "Bid status updated successfully",
        };
        return reply.status(200).send(response);
    }
    async getBidsApplicationId(request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) {
        const result = await this.service.getBidsApplicationId(request.params.id);
        const response: Response<BidPublic[]> = {
            success: true,
            payload: result,
            message: "Bids fetched successfully",
        };
        return reply.status(200).send(response);
    }
}
