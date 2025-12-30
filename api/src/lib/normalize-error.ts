import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "./errors.js";

export const normalizeError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    const appError = AppError.badRequest("Validation error", {
      code: "VALIDATION_ERROR",
      cause: error,
    });
    appError.details = error.flatten();
    return appError;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = (() => {
      switch (error.code) {
        case "P2002":
          return AppError.conflict("Resource already exists", {
            code: "UNIQUE_CONSTRAINT_VIOLATION",
            cause: error,
          });
        case "P2025":
          return AppError.notFound("Resource", {
            code: "RESOURCE_NOT_FOUND",
            cause: error,
          });
        case "P2003":
          return AppError.badRequest("Invalid reference", {
            code: "FOREIGN_KEY_CONSTRAINT_FAILED",
            cause: error,
          });
        default:
          return AppError.internal(error.message, {
            code: "PRISMA_REQUEST_ERROR",
            cause: error,
          });
      }
    })();

    appError.details = error.meta ?? {};
    return appError;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    const appError = AppError.badRequest("Invalid request", {
      code: "PRISMA_VALIDATION_ERROR",
      cause: error,
    });
    appError.details = { message: error.message };
    return appError;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    const appError = AppError.serviceUnavailable("Database unavailable", {
      code: "PRISMA_INIT_ERROR",
      cause: error,
    });
    appError.details = { message: error.message };
    return appError;
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    const appError = AppError.internal("Database error", {
      code: "PRISMA_RUST_PANIC",
      cause: error,
    });
    appError.details = { message: error.message };
    return appError;
  }

  return AppError.internal(
    error instanceof Error ? error.message : "Internal server error",
    { cause: error }
  );
};
