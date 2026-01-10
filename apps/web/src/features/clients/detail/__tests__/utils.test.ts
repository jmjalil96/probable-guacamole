import { describe, it, expect } from "vitest";
import type { Client } from "shared";
import { extractFormError, mapClientToFormValues, mapFormToRequest } from "../utils";
import type { ClientFormData } from "../schema";
import { ApiError } from "@/lib/api";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockClient: Client = {
  id: "client-1",
  name: "Test Corporation",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

// =============================================================================
// mapClientToFormValues
// =============================================================================

describe("mapClientToFormValues", () => {
  it("maps all client fields to form values", () => {
    const result = mapClientToFormValues(mockClient);

    expect(result).toEqual({
      name: "Test Corporation",
      isActive: true,
    });
  });

  it("maps inactive client correctly", () => {
    const inactiveClient: Client = {
      ...mockClient,
      isActive: false,
    };

    const result = mapClientToFormValues(inactiveClient);

    expect(result.isActive).toBe(false);
  });
});

// =============================================================================
// mapFormToRequest
// =============================================================================

describe("mapFormToRequest", () => {
  it("returns empty object when no changes", () => {
    const formData: ClientFormData = {
      name: "Test Corporation",
      isActive: true,
    };

    const result = mapFormToRequest(formData, mockClient);

    expect(result).toEqual({});
  });

  it("includes name when changed", () => {
    const formData: ClientFormData = {
      name: "Updated Corporation",
      isActive: true,
    };

    const result = mapFormToRequest(formData, mockClient);

    expect(result).toEqual({
      name: "Updated Corporation",
    });
  });

  it("includes isActive when changed to false", () => {
    const formData: ClientFormData = {
      name: "Test Corporation",
      isActive: false,
    };

    const result = mapFormToRequest(formData, mockClient);

    expect(result).toEqual({
      isActive: false,
    });
  });

  it("includes isActive when changed to true", () => {
    const inactiveClient: Client = {
      ...mockClient,
      isActive: false,
    };

    const formData: ClientFormData = {
      name: "Test Corporation",
      isActive: true,
    };

    const result = mapFormToRequest(formData, inactiveClient);

    expect(result).toEqual({
      isActive: true,
    });
  });

  it("includes multiple changed fields", () => {
    const formData: ClientFormData = {
      name: "Updated Corporation",
      isActive: false,
    };

    const result = mapFormToRequest(formData, mockClient);

    expect(result).toEqual({
      name: "Updated Corporation",
      isActive: false,
    });
  });
});

// =============================================================================
// extractFormError
// =============================================================================

describe("extractFormError", () => {
  it("returns generic error for non-API errors", () => {
    const error = new Error("Something went wrong");

    const result = extractFormError(error);

    expect(result).toEqual({
      title: "Error al guardar",
      description: "Something went wrong",
    });
  });

  it("handles network errors", () => {
    // status=0 means network error
    const error = new ApiError(0, "NETWORK_ERROR", "Network request failed");

    const result = extractFormError(error);

    expect(result.title).toBe("Sin conexion");
    expect(result.description).toContain("conexion");
  });

  it("handles affiliates constraint error", () => {
    const error = new ApiError(409, "CONFLICT", "Cannot delete: client has affiliates");

    const result = extractFormError(error);

    expect(result.title).toBe("No se puede eliminar");
    expect(result.description).toContain("afiliados");
  });

  it("handles claims constraint error", () => {
    const error = new ApiError(409, "CONFLICT", "Cannot delete: client has claims");

    const result = extractFormError(error);

    expect(result.title).toBe("No se puede eliminar");
    expect(result.description).toContain("reclamos");
  });

  it("handles policies constraint error", () => {
    const error = new ApiError(409, "CONFLICT", "Cannot delete: client has policies");

    const result = extractFormError(error);

    expect(result.title).toBe("No se puede eliminar");
    expect(result.description).toContain("polizas");
  });

  it("handles uniqueness error", () => {
    const error = new ApiError(409, "CONFLICT", "Client with name already exists");

    const result = extractFormError(error);

    expect(result.title).toBe("Error de validacion");
    expect(result.description).toContain("already exists");
  });

  it("handles field errors with Spanish labels", () => {
    const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
      fieldErrors: {
        name: ["Name is required"],
      },
    });

    const result = extractFormError(error);

    expect(result.title).toBe("Error de validacion");
    expect(result.items).toBeDefined();
    expect(result.items).toHaveLength(1);
    expect(result.items![0]).toContain("Nombre");
  });

  it("handles multiple field errors", () => {
    const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
      fieldErrors: {
        name: ["Name is required", "Name is too short"],
        isActive: ["Invalid value"],
      },
    });

    const result = extractFormError(error);

    expect(result.items).toHaveLength(3);
  });

  it("returns fallback for unknown API errors", () => {
    const error = new ApiError(500, "INTERNAL_ERROR", "Something unexpected");

    const result = extractFormError(error);

    expect(result.title).toBe("Error al guardar");
    expect(result.description).toBe("Something unexpected");
  });
});
