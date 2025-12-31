import pino, { type DestinationStream, type LoggerOptions } from "pino";

const environment = process.env.NODE_ENV ?? "development";
const isProduction = environment === "production";

const level = process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

const service =
  process.env.SERVICE_NAME ?? process.env.npm_package_name ?? "api";
const version =
  process.env.SERVICE_VERSION ?? process.env.npm_package_version ?? "unknown";

const options: LoggerOptions = {
  level,
  base: {
    service,
    environment,
    version,
  },
  redact: {
    paths: [
      "password",
      "*.password",
      "token",
      "*.token",
      "accessToken",
      "*.accessToken",
      "refreshToken",
      "*.refreshToken",
      "secret",
      "*.secret",
      "apiKey",
      "*.apiKey",
      "authorization",
      "*.authorization",
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['set-cookie']",
      "req.headers['x-api-key']",
      "req.body.password",
      "req.body.token",
      "req.body.accessToken",
      "req.body.refreshToken",
      "req.body.secret",
      "req.body.apiKey",
      "res.headers['set-cookie']",
      "response.headers['set-cookie']",
    ],
    remove: true,
  },
};

const transport: DestinationStream | undefined = isProduction
  ? undefined
  : (pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    }) as DestinationStream);

export const logger = pino(options, transport);

export const createRequestLogger = (requestId: string) =>
  logger.child({ requestId });

export const createJobLogger = (jobId: string | number, jobType: string) =>
  logger.child({ jobId, jobType });
