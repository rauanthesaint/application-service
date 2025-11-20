import { FastifyInstance } from "fastify";
import Fastify from "fastify";
import { env, loggerConfig } from "./config";
import { DatabaseManager } from "./database/manager";
import { Repository } from "./repositories/Repository";
import { Service } from "./services/Service";
import { Controller } from "./controllers/Controller";
import { errorHandler } from "./middlewares";
import { router } from "./routes/router.v1";

const application: FastifyInstance = Fastify({
    logger: loggerConfig,
});

const database = new DatabaseManager(env.DATABASE_URL, application.log);
const repository = new Repository(database);
const service = new Service(repository, { logger: application.log });
const controller = new Controller(service);

application.setErrorHandler(async (error, request, reply) => errorHandler(error, request, reply, application.log));
application.register((application) => router(application, controller), { prefix: "/api" });

const launch = async () => {
    try {
        await application.listen({ port: env.PORT });
        application.log.info("Server started successfully");
    } catch (err) {
        application.log.error(err);
        process.exit(1);
    }
};

await launch();
