import { Application, ApplicationDTO, ApplicationPublic, LoadType } from "@/models";
import { ApplicationDTOSchema, IdSchema } from "@/models/schemas";
import { IRepository } from "@/repositories/Repository.interface";
import { FastifyBaseLogger } from "fastify";
import createHttpError from "http-errors";

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

    async createApplication(dto: ApplicationDTO): Promise<ApplicationPublic> {
        const { success, data, error } = ApplicationDTOSchema.safeParse(dto);
        if (!success) {
            this.options?.logger.error(`Invalid data. Error: ${error}`);
            throw new createHttpError[400]("Invalid data");
        }

        const application = await this.repository.createApplication(data);
        return application;
    }
}
