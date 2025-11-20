import { Controller } from "@/controllers/Controller";
import { FastifyInstance } from "fastify";

export function router(application: FastifyInstance, controller: Controller) {
    application.get("/applications/:id", controller.getApplicationById.bind(controller));
    application.post("/applications", controller.createApplication.bind(controller));

    application.get("/applications/load/types", controller.getLoadTypes.bind(controller));
}
