import { Controller } from "@/controllers/Controller";
import { FastifyInstance } from "fastify";

export function router(application: FastifyInstance, controller: Controller) {
    application.get("/applications/:id", controller.getApplicationById.bind(controller));
    application.post("/applications", controller.createApplication.bind(controller));
    application.delete("/applications/:id", controller.deleteApplicationById.bind(controller));
    application.get("/applications", controller.getApplications.bind(controller));

    application.get("/applications/load/types", controller.getLoadTypes.bind(controller));
    application.get("/applications/transport/types", controller.getTransportTypes.bind(controller));
    application.get(
        "/applications/payment/conditions-methods",
        controller.getPaymentConditionsAndMethods.bind(controller)
    );

    application.get("/applications/bids/:id", controller.getBidById.bind(controller));
    application.post("/applications/bids", controller.createBid.bind(controller));
    application.patch("/applications/bids/:id", controller.updateBidStatus.bind(controller));
    application.get("/applications/:id/bids", controller.updateBidStatus.bind(controller));
}
