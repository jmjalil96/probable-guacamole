import { describe, it, expect } from "vitest";
import {
  mapClaimToFormValues,
  mapFormToRequest,
  extractTransitionError,
  extractFormError,
} from "../utils";
import { ApiError } from "@/lib/api/errors";
import type { ClaimDetail } from "shared";
import type { EditClaimForm } from "../schema";

// =============================================================================
// Test Fixtures
// =============================================================================

const baseClaim: ClaimDetail = {
  id: "claim-1",
  claimNumber: 1,
  status: "DRAFT",
  description: "Test claim description",
  diagnosis: "Test diagnosis",
  careType: "AMBULATORY",
  incidentDate: "2024-01-15",
  submittedDate: null,
  settlementDate: null,
  businessDays: null,
  amountSubmitted: "1000.00",
  amountApproved: null,
  amountDenied: null,
  amountUnprocessed: null,
  deductibleApplied: null,
  copayApplied: null,
  settlementNumber: null,
  settlementNotes: null,
  policy: { id: "policy-1", number: "POL-001" },
  client: { id: "client-1", name: "Test Client" },
  affiliate: { id: "affiliate-1", name: "Test Affiliate" },
  patient: { id: "patient-1", name: "John Doe" },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  createdBy: { id: "user-1", name: "Admin User" },
  updatedBy: null,
};

// =============================================================================
// mapClaimToFormValues
// =============================================================================

describe("mapClaimToFormValues", () => {
  it("maps all claim fields to form values", () => {
    const result = mapClaimToFormValues(baseClaim);

    expect(result).toEqual({
      policyId: "policy-1",
      careType: "AMBULATORY",
      diagnosis: "Test diagnosis",
      description: "Test claim description",
      incidentDate: "2024-01-15",
      submittedDate: null,
      settlementDate: null,
      amountSubmitted: "1000.00",
      amountApproved: null,
      amountDenied: null,
      amountUnprocessed: null,
      deductibleApplied: null,
      copayApplied: null,
      settlementNumber: null,
      settlementNotes: null,
    });
  });

  it("extracts policy ID from nested policy object", () => {
    const claim = {
      ...baseClaim,
      policy: { id: "nested-policy-id", number: "POL-002" },
    };
    const result = mapClaimToFormValues(claim);

    expect(result.policyId).toBe("nested-policy-id");
  });

  it("returns null policyId when policy is null", () => {
    const claim = { ...baseClaim, policy: null } as unknown as ClaimDetail;
    const result = mapClaimToFormValues(claim);

    expect(result.policyId).toBeNull();
  });

  it("preserves nullable fields as null", () => {
    const claim: ClaimDetail = {
      ...baseClaim,
      diagnosis: null,
      settlementDate: null,
      amountApproved: null,
      settlementNotes: null,
    };
    const result = mapClaimToFormValues(claim);

    expect(result.diagnosis).toBeNull();
    expect(result.settlementDate).toBeNull();
    expect(result.amountApproved).toBeNull();
    expect(result.settlementNotes).toBeNull();
  });

  it("maps all financial fields correctly", () => {
    const claim: ClaimDetail = {
      ...baseClaim,
      amountSubmitted: "5000.00",
      amountApproved: "4500.00",
      amountDenied: "300.00",
      amountUnprocessed: "200.00",
      deductibleApplied: "100.00",
      copayApplied: "50.00",
    };
    const result = mapClaimToFormValues(claim);

    expect(result.amountSubmitted).toBe("5000.00");
    expect(result.amountApproved).toBe("4500.00");
    expect(result.amountDenied).toBe("300.00");
    expect(result.amountUnprocessed).toBe("200.00");
    expect(result.deductibleApplied).toBe("100.00");
    expect(result.copayApplied).toBe("50.00");
  });

  it("maps all date fields correctly", () => {
    const claim: ClaimDetail = {
      ...baseClaim,
      incidentDate: "2024-01-15",
      submittedDate: "2024-01-20",
      settlementDate: "2024-02-01",
    };
    const result = mapClaimToFormValues(claim);

    expect(result.incidentDate).toBe("2024-01-15");
    expect(result.submittedDate).toBe("2024-01-20");
    expect(result.settlementDate).toBe("2024-02-01");
  });
});

// =============================================================================
// mapFormToRequest
// =============================================================================

describe("mapFormToRequest", () => {
  const originalForm = mapClaimToFormValues(baseClaim);

  it("returns empty object when nothing changed", () => {
    const result = mapFormToRequest(originalForm, baseClaim);

    expect(result).toEqual({});
  });

  it("only includes changed fields", () => {
    const changedForm: EditClaimForm = {
      ...originalForm,
      description: "Updated description",
    };
    const result = mapFormToRequest(changedForm, baseClaim);

    expect(result).toEqual({ description: "Updated description" });
    expect(Object.keys(result)).toHaveLength(1);
  });

  it("includes multiple changed fields", () => {
    const changedForm: EditClaimForm = {
      ...originalForm,
      description: "Updated description",
      diagnosis: "Updated diagnosis",
      careType: "HOSPITALARY",
    };
    const result = mapFormToRequest(changedForm, baseClaim);

    expect(result).toEqual({
      description: "Updated description",
      diagnosis: "Updated diagnosis",
      careType: "HOSPITALARY",
    });
  });

  it("detects policyId change from nested policy object", () => {
    const changedForm: EditClaimForm = {
      ...originalForm,
      policyId: "new-policy-id",
    };
    const result = mapFormToRequest(changedForm, baseClaim);

    expect(result).toEqual({ policyId: "new-policy-id" });
  });

  it("detects change from null to value", () => {
    const claimWithNulls: ClaimDetail = {
      ...baseClaim,
      diagnosis: null,
      settlementNotes: null,
    };
    const original = mapClaimToFormValues(claimWithNulls);
    const changedForm: EditClaimForm = {
      ...original,
      diagnosis: "New diagnosis",
      settlementNotes: "New notes",
    };
    const result = mapFormToRequest(changedForm, claimWithNulls);

    expect(result).toEqual({
      diagnosis: "New diagnosis",
      settlementNotes: "New notes",
    });
  });

  it("detects change from value to null", () => {
    const changedForm: EditClaimForm = {
      ...originalForm,
      diagnosis: null,
    };
    const result = mapFormToRequest(changedForm, baseClaim);

    expect(result).toEqual({ diagnosis: null });
  });

  it("detects all financial field changes", () => {
    const changedForm: EditClaimForm = {
      ...originalForm,
      amountSubmitted: "2000.00",
      amountApproved: "1800.00",
      deductibleApplied: "100.00",
    };
    const result = mapFormToRequest(changedForm, baseClaim);

    expect(result).toEqual({
      amountSubmitted: "2000.00",
      amountApproved: "1800.00",
      deductibleApplied: "100.00",
    });
  });

  it("detects all date field changes", () => {
    const changedForm: EditClaimForm = {
      ...originalForm,
      incidentDate: "2024-02-01",
      submittedDate: "2024-02-15",
    };
    const result = mapFormToRequest(changedForm, baseClaim);

    expect(result).toEqual({
      incidentDate: "2024-02-01",
      submittedDate: "2024-02-15",
    });
  });

  it("does not include unchanged fields when some fields change", () => {
    const changedForm: EditClaimForm = {
      ...originalForm,
      description: "Changed",
    };
    const result = mapFormToRequest(changedForm, baseClaim);

    expect(result).not.toHaveProperty("policyId");
    expect(result).not.toHaveProperty("careType");
    expect(result).not.toHaveProperty("diagnosis");
    expect(result).not.toHaveProperty("amountSubmitted");
  });
});

// =============================================================================
// extractTransitionError
// =============================================================================

describe("extractTransitionError", () => {
  describe("generic errors", () => {
    it("handles non-API errors", () => {
      const error = new Error("Something went wrong");
      const result = extractTransitionError(error);

      expect(result.title).toBe("Error al actualizar estado");
      expect(result.description).toBe("Something went wrong");
      expect(result.items).toEqual([]);
    });

    it("handles network errors in message", () => {
      const error = new Error("Network error occurred");
      const result = extractTransitionError(error);

      expect(result.title).toBe("Error de conexión");
      expect(result.description).toContain("conexión");
    });

    it("handles timeout errors in message", () => {
      const error = new Error("Request timeout");
      const result = extractTransitionError(error);

      expect(result.title).toBe("Error de conexión");
    });
  });

  describe("API errors", () => {
    it("handles network API errors", () => {
      const error = new ApiError(0, "NETWORK_ERROR", "Network error");
      const result = extractTransitionError(error);

      expect(result.title).toBe("Sin conexión");
      expect(result.description).toContain("conexión");
    });

    it("handles unauthorized API errors", () => {
      const error = new ApiError(401, "UNAUTHORIZED", "Unauthorized");
      const result = extractTransitionError(error);

      expect(result.title).toBe("Sesión expirada");
      expect(result.description).toContain("sesión");
    });

    it("handles generic API error messages", () => {
      const error = new ApiError(500, "SERVER_ERROR", "Internal server error");
      const result = extractTransitionError(error);

      expect(result.title).toBe("Error al actualizar estado");
      expect(result.description).toBe("Internal server error");
    });
  });

  describe("missing required fields pattern", () => {
    it("parses missing required fields message", () => {
      const error = new ApiError(
        400,
        "VALIDATION_ERROR",
        "Missing required fields for SUBMITTED: incidentDate, diagnosis"
      );
      const result = extractTransitionError(error);

      expect(result.title).toBe("Campos requeridos");
      expect(result.description).toContain("Enviado");
      expect(result.items).toContain("Fecha de Incidente");
      expect(result.items).toContain("Diagnóstico");
    });

    it("maps field names to Spanish labels", () => {
      const error = new ApiError(
        400,
        "VALIDATION_ERROR",
        "Missing required fields for IN_REVIEW: amountSubmitted, careType"
      );
      const result = extractTransitionError(error);

      expect(result.items).toContain("Monto Enviado");
      expect(result.items).toContain("Tipo de Atención");
    });

    it("maps status to Spanish label in description", () => {
      const error = new ApiError(
        400,
        "VALIDATION_ERROR",
        "Missing required fields for PENDING_INFO: reason"
      );
      const result = extractTransitionError(error);

      expect(result.description).toContain("Info Pendiente");
    });
  });

  describe("field validation errors", () => {
    it("extracts field errors with Spanish labels", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          description: ["Required"],
          amountSubmitted: ["Must be a valid number"],
        },
      });
      const result = extractTransitionError(error);

      expect(result.items).toContain("Descripción");
      expect(result.items).toContain("Monto Enviado: Must be a valid number");
    });

    it("simplifies 'required' messages to just field label", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          diagnosis: ["required"],
          careType: ["requerido"],
        },
      });
      const result = extractTransitionError(error);

      expect(result.items).toContain("Diagnóstico");
      expect(result.items).toContain("Tipo de Atención");
      expect(result.items).not.toContain("Diagnóstico: required");
    });

    it("extracts form errors", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        formErrors: ["General validation error"],
      });
      const result = extractTransitionError(error);

      expect(result.items).toContain("General validation error");
    });
  });
});

// =============================================================================
// extractFormError
// =============================================================================

describe("extractFormError", () => {
  describe("generic errors", () => {
    it("uses form-specific default title", () => {
      const error = new Error("Something went wrong");
      const result = extractFormError(error);

      expect(result.title).toBe("Error al guardar");
    });

    it("handles non-API errors", () => {
      const error = new Error("Unexpected error");
      const result = extractFormError(error);

      expect(result.description).toBe("Unexpected error");
      expect(result.items).toEqual([]);
    });
  });

  describe("not editable fields pattern", () => {
    it("parses not editable fields message", () => {
      const error = new ApiError(
        400,
        "VALIDATION_ERROR",
        "Fields not editable in SETTLED status: amountApproved, settlementDate"
      );
      const result = extractFormError(error);

      expect(result.title).toBe("Campos no editables");
      expect(result.description).toContain("Liquidado");
      expect(result.items).toContain("Monto Aprobado");
      expect(result.items).toContain("Fecha de Liquidación");
    });

    it("maps status name in description", () => {
      const error = new ApiError(
        400,
        "VALIDATION_ERROR",
        "Fields not editable in IN_REVIEW status: description"
      );
      const result = extractFormError(error);

      expect(result.description).toContain("En Revisión");
    });
  });

  describe("validation errors", () => {
    it("uses form-specific validation messages", () => {
      const error = new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        fieldErrors: {
          description: ["Too long"],
        },
      });
      const result = extractFormError(error);

      expect(result.title).toBe("Error de validación");
      expect(result.description).toBe("Corrija los siguientes campos:");
    });
  });

  describe("API errors", () => {
    it("handles network errors", () => {
      const error = new ApiError(0, "NETWORK_ERROR", "Network error");
      const result = extractFormError(error);

      expect(result.title).toBe("Sin conexión");
    });

    it("handles 401 errors", () => {
      const error = new ApiError(401, "UNAUTHORIZED", "Unauthorized");
      const result = extractFormError(error);

      expect(result.title).toBe("Sesión expirada");
    });

    it("handles generic API errors", () => {
      const error = new ApiError(500, "SERVER_ERROR", "Internal error");
      const result = extractFormError(error);

      expect(result.title).toBe("Error al guardar");
      expect(result.description).toBe("Internal error");
    });
  });
});
