import { describe, it, expect } from "vitest";
import {
  mapInsurerToFormValues,
  mapFormToRequest,
  extractFormError,
} from "../utils";
import { ApiError } from "@/lib/api/errors";
import type { Insurer } from "shared";
import type { InsurerFormData } from "../schema";

// =============================================================================
// Test Fixtures
// =============================================================================

const baseInsurer: Insurer = {
  id: "insurer-1",
  name: "Test Insurance Co",
  code: "TIC-001",
  email: "contact@test.com",
  phone: "+1234567890",
  website: "https://test.com",
  type: "COMPANIA_DE_SEGUROS",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

// =============================================================================
// mapInsurerToFormValues
// =============================================================================

describe("mapInsurerToFormValues", () => {
  it("maps all insurer fields to form values", () => {
    const result = mapInsurerToFormValues(baseInsurer);

    expect(result).toEqual({
      name: "Test Insurance Co",
      code: "TIC-001",
      email: "contact@test.com",
      phone: "+1234567890",
      website: "https://test.com",
      type: "COMPANIA_DE_SEGUROS",
      isActive: true,
    });
  });

  it("handles null code", () => {
    const insurer = { ...baseInsurer, code: null };
    const result = mapInsurerToFormValues(insurer);

    expect(result.code).toBeNull();
  });

  it("handles null email", () => {
    const insurer = { ...baseInsurer, email: null };
    const result = mapInsurerToFormValues(insurer);

    expect(result.email).toBeNull();
  });

  it("handles null phone", () => {
    const insurer = { ...baseInsurer, phone: null };
    const result = mapInsurerToFormValues(insurer);

    expect(result.phone).toBeNull();
  });

  it("handles null website", () => {
    const insurer = { ...baseInsurer, website: null };
    const result = mapInsurerToFormValues(insurer);

    expect(result.website).toBeNull();
  });

  it("handles all nullable fields as null", () => {
    const insurer: Insurer = {
      ...baseInsurer,
      code: null,
      email: null,
      phone: null,
      website: null,
    };
    const result = mapInsurerToFormValues(insurer);

    expect(result.code).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.website).toBeNull();
  });

  it("maps MEDICINA_PREPAGADA type correctly", () => {
    const insurer = { ...baseInsurer, type: "MEDICINA_PREPAGADA" as const };
    const result = mapInsurerToFormValues(insurer);

    expect(result.type).toBe("MEDICINA_PREPAGADA");
  });

  it("maps isActive false correctly", () => {
    const insurer = { ...baseInsurer, isActive: false };
    const result = mapInsurerToFormValues(insurer);

    expect(result.isActive).toBe(false);
  });
});

// =============================================================================
// mapFormToRequest
// =============================================================================

describe("mapFormToRequest", () => {
  const originalForm = mapInsurerToFormValues(baseInsurer);

  it("returns empty object when nothing changed", () => {
    const result = mapFormToRequest(originalForm, baseInsurer);

    expect(result).toEqual({});
  });

  it("only includes changed fields", () => {
    const changedForm: InsurerFormData = {
      ...originalForm,
      name: "Updated Insurance Co",
    };
    const result = mapFormToRequest(changedForm, baseInsurer);

    expect(result).toEqual({ name: "Updated Insurance Co" });
    expect(Object.keys(result)).toHaveLength(1);
  });

  it("includes multiple changed fields", () => {
    const changedForm: InsurerFormData = {
      ...originalForm,
      name: "Updated Name",
      code: "UPD-001",
      email: "updated@test.com",
    };
    const result = mapFormToRequest(changedForm, baseInsurer);

    expect(result).toEqual({
      name: "Updated Name",
      code: "UPD-001",
      email: "updated@test.com",
    });
  });

  it("detects code change", () => {
    const changedForm: InsurerFormData = {
      ...originalForm,
      code: "NEW-CODE",
    };
    const result = mapFormToRequest(changedForm, baseInsurer);

    expect(result).toEqual({ code: "NEW-CODE" });
  });

  it("detects email change from null to value", () => {
    const insurerWithNullEmail = { ...baseInsurer, email: null };
    const original = mapInsurerToFormValues(insurerWithNullEmail);
    const changedForm: InsurerFormData = {
      ...original,
      email: "new@email.com",
    };
    const result = mapFormToRequest(changedForm, insurerWithNullEmail);

    expect(result).toEqual({ email: "new@email.com" });
  });

  it("detects email change from value to null", () => {
    const changedForm: InsurerFormData = {
      ...originalForm,
      email: null,
    };
    const result = mapFormToRequest(changedForm, baseInsurer);

    expect(result).toEqual({ email: null });
  });

  it("handles email empty string as null", () => {
    const changedForm: InsurerFormData = {
      ...originalForm,
      email: "",
    };
    const result = mapFormToRequest(changedForm, baseInsurer);

    expect(result).toEqual({ email: null });
  });

  it("detects website change from null to value", () => {
    const insurerWithNullWebsite = { ...baseInsurer, website: null };
    const original = mapInsurerToFormValues(insurerWithNullWebsite);
    const changedForm: InsurerFormData = {
      ...original,
      website: "https://new.com",
    };
    const result = mapFormToRequest(changedForm, insurerWithNullWebsite);

    expect(result).toEqual({ website: "https://new.com" });
  });

  it("handles website empty string as null", () => {
    const changedForm: InsurerFormData = {
      ...originalForm,
      website: "",
    };
    const result = mapFormToRequest(changedForm, baseInsurer);

    expect(result).toEqual({ website: null });
  });

  it("detects type change", () => {
    const changedForm: InsurerFormData = {
      ...originalForm,
      type: "MEDICINA_PREPAGADA",
    };
    const result = mapFormToRequest(changedForm, baseInsurer);

    expect(result).toEqual({ type: "MEDICINA_PREPAGADA" });
  });

  it("detects isActive change", () => {
    const changedForm: InsurerFormData = {
      ...originalForm,
      isActive: false,
    };
    const result = mapFormToRequest(changedForm, baseInsurer);

    expect(result).toEqual({ isActive: false });
  });

  it("does not include unchanged fields when some fields change", () => {
    const changedForm: InsurerFormData = {
      ...originalForm,
      name: "Changed",
    };
    const result = mapFormToRequest(changedForm, baseInsurer);

    expect(result).not.toHaveProperty("code");
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("phone");
    expect(result).not.toHaveProperty("website");
    expect(result).not.toHaveProperty("type");
    expect(result).not.toHaveProperty("isActive");
  });
});

// =============================================================================
// extractFormError
// =============================================================================

describe("extractFormError", () => {
  describe("generic errors", () => {
    it("handles non-API errors", () => {
      const error = new Error("Something went wrong");
      const result = extractFormError(error);

      expect(result.title).toBe("Error al guardar");
      expect(result.description).toBe("Something went wrong");
    });

    it("handles error without message", () => {
      const error = new Error();
      const result = extractFormError(error);

      expect(result.title).toBe("Error al guardar");
      expect(result.description).toBe("Ocurrio un error inesperado");
    });
  });

  describe("network errors", () => {
    it("handles network API errors", () => {
      const error = new ApiError(0, "NETWORK_ERROR", "Network error");
      // Manually set isNetworkError to simulate network error
      Object.defineProperty(error, "isNetworkError", { value: true });
      const result = extractFormError(error);

      expect(result.title).toBe("Sin conexion");
      expect(result.description).toContain("conexion");
    });
  });

  describe("policies constraint error", () => {
    it("detects policies error in English", () => {
      const error = new ApiError(
        409,
        "CONFLICT",
        "Cannot delete insurer with associated policies"
      );
      const result = extractFormError(error);

      expect(result.title).toBe("No se puede eliminar");
      expect(result.description).toContain("polizas asociadas");
    });

    it("detects policies error in Spanish", () => {
      const error = new ApiError(
        409,
        "CONFLICT",
        "No se puede eliminar la aseguradora con polizas asociadas"
      );
      const result = extractFormError(error);

      expect(result.title).toBe("No se puede eliminar");
      expect(result.description).toContain("polizas asociadas");
    });
  });

  describe("uniqueness errors", () => {
    it("handles already exists error in English", () => {
      const error = new ApiError(
        409,
        "CONFLICT",
        "An insurer with this name already exists"
      );
      const result = extractFormError(error);

      expect(result.title).toBe("Error de validacion");
      expect(result.description).toBe(
        "An insurer with this name already exists"
      );
    });

    it("handles ya existe error in Spanish", () => {
      const error = new ApiError(
        409,
        "CONFLICT",
        "Una aseguradora con este nombre ya existe"
      );
      const result = extractFormError(error);

      expect(result.title).toBe("Error de validacion");
      expect(result.description).toBe(
        "Una aseguradora con este nombre ya existe"
      );
    });
  });

  describe("field validation errors", () => {
    it("extracts field errors with Spanish labels", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          name: ["Required"],
          email: ["Invalid email format"],
        },
      });
      const result = extractFormError(error);

      expect(result.title).toBe("Error de validacion");
      expect(result.description).toBe("Corrija los siguientes campos:");
      expect(result.items).toContain("Nombre: Required");
      expect(result.items).toContain("Email: Invalid email format");
    });

    it("maps code field to Codigo", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          code: ["Too long"],
        },
      });
      const result = extractFormError(error);

      expect(result.items).toContain("Codigo: Too long");
    });

    it("maps phone field to Telefono", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          phone: ["Invalid format"],
        },
      });
      const result = extractFormError(error);

      expect(result.items).toContain("Telefono: Invalid format");
    });

    it("maps website field to Sitio Web", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          website: ["Invalid URL"],
        },
      });
      const result = extractFormError(error);

      expect(result.items).toContain("Sitio Web: Invalid URL");
    });

    it("maps type field to Tipo", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          type: ["Invalid type"],
        },
      });
      const result = extractFormError(error);

      expect(result.items).toContain("Tipo: Invalid type");
    });

    it("maps isActive field to Estado", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          isActive: ["Invalid value"],
        },
      });
      const result = extractFormError(error);

      expect(result.items).toContain("Estado: Invalid value");
    });

    it("handles multiple messages for same field", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          email: ["Required", "Invalid format"],
        },
      });
      const result = extractFormError(error);

      expect(result.items).toContain("Email: Required");
      expect(result.items).toContain("Email: Invalid format");
    });

    it("falls back to field name for unknown fields", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          unknownField: ["Error message"],
        },
      });
      const result = extractFormError(error);

      expect(result.items).toContain("unknownField: Error message");
    });
  });

  describe("API errors without field errors", () => {
    it("handles generic API error", () => {
      const error = new ApiError(500, "SERVER_ERROR", "Internal server error");
      const result = extractFormError(error);

      expect(result.title).toBe("Error al guardar");
      expect(result.description).toBe("Internal server error");
    });

    it("handles API error without message", () => {
      const error = new ApiError(500, "SERVER_ERROR", "");
      const result = extractFormError(error);

      expect(result.title).toBe("Error al guardar");
      expect(result.description).toBe("No se pudo completar la operacion.");
    });
  });
});
