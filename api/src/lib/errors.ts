export type AppErrorOptions = {
  message: string;
  statusCode: number;
  code?: string;
  isOperational?: boolean;
  cause?: unknown;
};

type AppErrorFactoryOptions = Omit<AppErrorOptions, "message" | "statusCode">;

const toCode = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

export class AppError extends Error {
  statusCode: number;
  code?: string;
  isOperational: boolean;
  details?: Record<string, unknown>;

  constructor({
    message,
    statusCode,
    code,
    isOperational = true,
    cause,
  }: AppErrorOptions) {
    super(message, { cause });
    this.name = "AppError";
    this.statusCode = statusCode;
    if (code !== undefined) this.code = code;
    this.isOperational = isOperational;
  }

  static badRequest(message: string, options: AppErrorFactoryOptions = {}) {
    return new AppError({
      message,
      statusCode: 400,
      code: options.code ?? "BAD_REQUEST",
      isOperational: options.isOperational ?? true,
      cause: options.cause,
    });
  }

  static unauthorized(
    message = "Unauthorized",
    options: AppErrorFactoryOptions = {}
  ) {
    return new AppError({
      message,
      statusCode: 401,
      code: options.code ?? "UNAUTHORIZED",
      isOperational: options.isOperational ?? true,
      cause: options.cause,
    });
  }

  static forbidden(
    message = "Forbidden",
    options: AppErrorFactoryOptions = {}
  ) {
    return new AppError({
      message,
      statusCode: 403,
      code: options.code ?? "FORBIDDEN",
      isOperational: options.isOperational ?? true,
      cause: options.cause,
    });
  }

  static notFound(resource: string, options: AppErrorFactoryOptions = {}) {
    return new AppError({
      message: `${resource} not found`,
      statusCode: 404,
      code: options.code ?? `${toCode(resource)}_NOT_FOUND`,
      isOperational: options.isOperational ?? true,
      cause: options.cause,
    });
  }

  static conflict(message: string, options: AppErrorFactoryOptions = {}) {
    return new AppError({
      message,
      statusCode: 409,
      code: options.code ?? "CONFLICT",
      isOperational: options.isOperational ?? true,
      cause: options.cause,
    });
  }

  static tooManyRequests(
    message = "Too many requests",
    options: AppErrorFactoryOptions = {}
  ) {
    return new AppError({
      message,
      statusCode: 429,
      code: options.code ?? "TOO_MANY_REQUESTS",
      isOperational: options.isOperational ?? true,
      cause: options.cause,
    });
  }

  static serviceUnavailable(
    message = "Service unavailable",
    options: AppErrorFactoryOptions = {}
  ) {
    return new AppError({
      message,
      statusCode: 503,
      code: options.code ?? "SERVICE_UNAVAILABLE",
      isOperational: options.isOperational ?? true,
      cause: options.cause,
    });
  }

  static internal(
    message = "Internal server error",
    options: AppErrorFactoryOptions = {}
  ) {
    return new AppError({
      message,
      statusCode: 500,
      code: options.code ?? "INTERNAL_SERVER_ERROR",
      isOperational: false,
      cause: options.cause,
    });
  }
}
