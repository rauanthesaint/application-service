import { FastifyBaseLogger, FastifyReply, FastifyRequest } from "fastify";
import { env } from "@/config";

export async function errorHandler(
    error: any,
    request: FastifyRequest,
    reply: FastifyReply,
    logger: FastifyBaseLogger
) {
    logger.error(error);
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
        success: false,
        message: env.ENV === "development" && error.message,
    });
}
