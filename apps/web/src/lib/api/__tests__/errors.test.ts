import { describe, it, expect } from "vitest";
import { ApiError, isApiError } from "../errors";

describe("ApiError", () => {
  describe("constructor", () => {
    it("creates an error with all properties", () => {
      const error = new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid input",
        { fieldErrors: { email: ["Invalid email"] } },
        "req-123"
      );

      expect(error.status).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Invalid input");
      expect(error.details).toEqual({
        fieldErrors: { email: ["Invalid email"] },
      });
      expect(error.requestId).toBe("req-123");
    });

    it("creates an error with minimal properties", () => {
      const error = new ApiError(500, "SERVER_ERROR", "Something went wrong");

      expect(error.status).toBe(500);
      expect(error.code).toBe("SERVER_ERROR");
      expect(error.message).toBe("Something went wrong");
      expect(error.details).toBeUndefined();
      expect(error.requestId).toBeUndefined();
    });

    it("sets the name to ApiError", () => {
      const error = new ApiError(400, "ERROR", "Message");
      expect(error.name).toBe("ApiError");
    });

    it("extends Error", () => {
      const error = new ApiError(400, "ERROR", "Message");
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("isUnauthorized", () => {
    it("returns true for 401 status", () => {
      const error = new ApiError(401, "UNAUTHORIZED", "Not authorized");
      expect(error.isUnauthorized).toBe(true);
    });

    it("returns false for other status codes", () => {
      expect(new ApiError(400, "ERROR", "Bad request").isUnauthorized).toBe(
        false
      );
      expect(new ApiError(403, "ERROR", "Forbidden").isUnauthorized).toBe(
        false
      );
      expect(new ApiError(500, "ERROR", "Server error").isUnauthorized).toBe(
        false
      );
    });
  });

  describe("isForbidden", () => {
    it("returns true for 403 status", () => {
      const error = new ApiError(403, "FORBIDDEN", "Access denied");
      expect(error.isForbidden).toBe(true);
    });

    it("returns false for other status codes", () => {
      expect(new ApiError(400, "ERROR", "Bad request").isForbidden).toBe(false);
      expect(new ApiError(401, "ERROR", "Unauthorized").isForbidden).toBe(
        false
      );
      expect(new ApiError(500, "ERROR", "Server error").isForbidden).toBe(
        false
      );
    });
  });

  describe("isNotFound", () => {
    it("returns true for 404 status", () => {
      const error = new ApiError(404, "NOT_FOUND", "Resource not found");
      expect(error.isNotFound).toBe(true);
    });

    it("returns false for other status codes", () => {
      expect(new ApiError(400, "ERROR", "Bad request").isNotFound).toBe(false);
      expect(new ApiError(500, "ERROR", "Server error").isNotFound).toBe(false);
    });
  });

  describe("isValidationError", () => {
    it("returns true for VALIDATION_ERROR code", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Invalid input");
      expect(error.isValidationError).toBe(true);
    });

    it("returns false for other codes", () => {
      expect(
        new ApiError(400, "BAD_REQUEST", "Bad request").isValidationError
      ).toBe(false);
      expect(
        new ApiError(500, "SERVER_ERROR", "Server error").isValidationError
      ).toBe(false);
    });
  });

  describe("isNetworkError", () => {
    it("returns true for status 0", () => {
      const error = new ApiError(0, "NETWORK_ERROR", "No connection");
      expect(error.isNetworkError).toBe(true);
    });

    it("returns false for other status codes", () => {
      expect(new ApiError(200, "OK", "Success").isNetworkError).toBe(false);
      expect(new ApiError(500, "ERROR", "Server error").isNetworkError).toBe(
        false
      );
    });
  });
});

describe("isApiError", () => {
  it("returns true for ApiError instances", () => {
    const error = new ApiError(400, "ERROR", "Message");
    expect(isApiError(error)).toBe(true);
  });

  it("returns false for regular Error", () => {
    const error = new Error("Regular error");
    expect(isApiError(error)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isApiError(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isApiError(undefined)).toBe(false);
  });

  it("returns false for plain objects", () => {
    const obj = { status: 400, code: "ERROR", message: "Message" };
    expect(isApiError(obj)).toBe(false);
  });

  it("returns false for strings", () => {
    expect(isApiError("error message")).toBe(false);
  });
});
