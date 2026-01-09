import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMutationError } from "../mutation-error-handler";
import { ApiError } from "../errors";
import { toast } from "@/lib/utils";

// Mock the toast module
vi.mock("@/lib/utils", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("handleMutationError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("unknown errors", () => {
    it("handles non-ApiError with default message", () => {
      const result = handleMutationError(new Error("Random error"));

      expect(result.title).toBe("Error inesperado");
      expect(result.description).toBe("Intente nuevamente");
      expect(toast.error).toHaveBeenCalledWith("Error inesperado", {
        description: "Intente nuevamente",
      });
    });

    it("uses custom unexpected message", () => {
      const result = handleMutationError(new Error("Random"), {
        unexpectedMessage: "Custom error",
      });

      expect(result.title).toBe("Custom error");
    });

    it("calls onFormError callback", () => {
      const onFormError = vi.fn();
      handleMutationError(new Error("Random"), { onFormError });

      expect(onFormError).toHaveBeenCalledWith({
        title: "Error inesperado",
        description: "Intente nuevamente",
      });
    });
  });

  describe("network errors", () => {
    it("handles network error with default message", () => {
      const error = new ApiError(0, "NETWORK_ERROR", "No connection");
      const result = handleMutationError(error);

      expect(result.title).toBe("Sin conexión");
      expect(result.description).toBe("Verifique su conexión a internet");
      expect(toast.error).toHaveBeenCalledWith("Sin conexión", {
        description: "Verifique su conexión a internet",
      });
    });

    it("uses custom network message", () => {
      const error = new ApiError(0, "NETWORK_ERROR", "No connection");
      const result = handleMutationError(error, {
        networkMessage: "No internet",
      });

      expect(result.title).toBe("No internet");
    });
  });

  describe("auth errors", () => {
    it("handles 401 error with default message", () => {
      const error = new ApiError(401, "UNAUTHORIZED", "Unauthorized");
      const result = handleMutationError(error);

      expect(result.title).toBe("Sesión expirada");
      expect(result.description).toBe("Por favor inicie sesión nuevamente");
      expect(toast.error).toHaveBeenCalledWith("Sesión expirada", {
        description: "Por favor inicie sesión nuevamente",
      });
    });

    it("uses custom auth message", () => {
      const error = new ApiError(401, "UNAUTHORIZED", "Unauthorized");
      const result = handleMutationError(error, {
        authMessage: "Please login",
      });

      expect(result.title).toBe("Please login");
    });
  });

  describe("validation errors with field errors", () => {
    it("extracts field errors into items", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          email: ["Invalid format", "Already exists"],
          name: ["Required"],
        },
      });
      const result = handleMutationError(error);

      expect(result.title).toBe("Validation failed");
      expect(result.items).toEqual([
        "email: Invalid format",
        "email: Already exists",
        "name: Required",
      ]);
    });

    it("shows field errors in toast", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Error", {
        fieldErrors: { email: ["Invalid"] },
      });
      handleMutationError(error);

      expect(toast.error).toHaveBeenCalledWith("Error", {
        description: "email: Invalid",
      });
    });
  });

  describe("validation errors with form errors", () => {
    it("extracts form errors into items", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Form error", {
        formErrors: ["General error 1", "General error 2"],
      });
      const result = handleMutationError(error);

      expect(result.items).toEqual(["General error 1", "General error 2"]);
    });
  });

  describe("other API errors", () => {
    it("uses error message as title", () => {
      const error = new ApiError(
        500,
        "SERVER_ERROR",
        "Database connection failed"
      );
      const result = handleMutationError(error);

      expect(result.title).toBe("Database connection failed");
      expect(toast.error).toHaveBeenCalledWith("Database connection failed");
    });

    it("uses fallback message when error message is empty", () => {
      const error = new ApiError(500, "SERVER_ERROR", "");
      const result = handleMutationError(error);

      expect(result.title).toBe("Error en la operación");
    });
  });

  describe("skipToast option", () => {
    it("skips toast when skipToast is true", () => {
      const error = new ApiError(400, "ERROR", "Error");
      handleMutationError(error, { skipToast: true });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it("still calls onFormError when skipToast is true", () => {
      const onFormError = vi.fn();
      const error = new ApiError(400, "ERROR", "Error");
      handleMutationError(error, { skipToast: true, onFormError });

      expect(onFormError).toHaveBeenCalled();
    });
  });

  describe("return value", () => {
    it("always returns a MutationErrorResult", () => {
      const error = new ApiError(400, "ERROR", "Message");
      const result = handleMutationError(error);

      expect(result).toHaveProperty("title");
      expect(typeof result.title).toBe("string");
    });
  });
});
