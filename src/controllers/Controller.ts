import { Application, ApplicationDTO, ApplicationPublic, LoadType } from "@/models";
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

    async createApplication(request: FastifyRequest<{ Body: ApplicationDTO }>, reply: FastifyReply) {
        const application = await this.service.createApplication(request.body);

        const response: Response<ApplicationPublic> = {
            success: true,
            payload: application,
            message: "Application created successfully",
        };

        return reply.status(201).send(response);
    }
}
