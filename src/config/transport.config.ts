import { FastifyLoggerOptions } from "fastify";

export const loggerConfig: FastifyLoggerOptions = {
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
    },
  },
} as FastifyLoggerOptions as any;
