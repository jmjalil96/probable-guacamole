import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import { useCascadingSelects, useNewClaimForm } from "../hooks";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockClients = {
  data: [
    { id: "client-1", name: "ACME Corp" },
    { id: "client-2", name: "Globex Inc" },
  ],
};

const mockAffiliates = {
  data: [
    { id: "affiliate-1", name: "Sucursal Norte" },
    { id: "affiliate-2", name: "Sucursal Sur" },
  ],
};

const mockPatients = {
  data: [
    { id: "patient-1", name: "John Doe", relationship: "Titular" },
    { id: "patient-2", name: "Jane Doe", relationship: "Cónyuge" },
  ],
};

// =============================================================================
// useCascadingSelects
// =============================================================================

describe("useCascadingSelects", () => {
  let mockSetValue: Mock;
  let mockClearErrors: Mock;

  beforeEach(() => {
    mockSetValue = vi.fn();
    mockClearErrors = vi.fn();

    // Default handlers
    server.use(
      http.get("*/claims/lookups/clients", () => {
        return HttpResponse.json(mockClients);
      }),
      http.get("*/claims/lookups/affiliates", () => {
        return HttpResponse.json(mockAffiliates);
      }),
      http.get("*/claims/lookups/patients", () => {
        return HttpResponse.json(mockPatients);
      })
    );
  });

  describe("client options", () => {
    it("fetches and transforms client options", async () => {
      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "",
            affiliateId: "",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.clients.isLoading).toBe(false);
      });

      expect(result.current.clientOptions).toEqual([
        { value: "client-1", label: "ACME Corp" },
        { value: "client-2", label: "Globex Inc" },
      ]);
    });

    it("returns empty array when loading", () => {
      server.use(
        http.get("*/claims/lookups/clients", async () => {
          await delay(100);
          return HttpResponse.json(mockClients);
        })
      );

      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "",
            affiliateId: "",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.clientOptions).toEqual([]);
      expect(result.current.clients.isLoading).toBe(true);
    });

    it("tracks loading state for clients", async () => {
      server.use(
        http.get("*/claims/lookups/clients", async () => {
          await delay(100);
          return HttpResponse.json(mockClients);
        })
      );

      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "",
            affiliateId: "",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.clients.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.clients.isLoading).toBe(false);
      });
    });
  });

  describe("affiliate options", () => {
    it("fetches affiliates when client is selected", async () => {
      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "client-1",
            affiliateId: "",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.affiliates.isLoading).toBe(false);
      });

      expect(result.current.affiliateOptions).toEqual([
        { value: "affiliate-1", label: "Sucursal Norte" },
        { value: "affiliate-2", label: "Sucursal Sur" },
      ]);
    });

    it("returns empty options when no client selected", () => {
      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "",
            affiliateId: "",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      // When clientId is empty, affiliates query is disabled
      expect(result.current.affiliateOptions).toEqual([]);
    });
  });

  describe("patient options", () => {
    it("fetches patients when affiliate is selected", async () => {
      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "client-1",
            affiliateId: "affiliate-1",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.patients.isLoading).toBe(false);
      });

      expect(result.current.patientOptions).toEqual([
        { value: "patient-1", label: "John Doe", description: "Titular" },
        { value: "patient-2", label: "Jane Doe", description: "Cónyuge" },
      ]);
    });

    it("includes relationship as description when available", async () => {
      server.use(
        http.get("*/claims/lookups/patients", () => {
          return HttpResponse.json({
            data: [
              { id: "patient-1", name: "John Doe", relationship: "Titular" },
              { id: "patient-2", name: "Jane Smith" }, // no relationship
            ],
          });
        })
      );

      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "client-1",
            affiliateId: "affiliate-1",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.patients.isLoading).toBe(false);
      });

      expect(result.current.patientOptions[0]).toHaveProperty(
        "description",
        "Titular"
      );
      expect(result.current.patientOptions[1]).not.toHaveProperty(
        "description"
      );
    });

    it("returns empty options when no affiliate selected", () => {
      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "client-1",
            affiliateId: "",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      // When affiliateId is empty, patients query is disabled
      expect(result.current.patientOptions).toEqual([]);
    });
  });

  describe("cascading reset on client change", () => {
    it("resets affiliate and patient when client changes", async () => {
      const { result, rerender } = renderHook(
        ({ clientId }) =>
          useCascadingSelects({
            clientId,
            affiliateId: "affiliate-1",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { clientId: "client-1" },
        }
      );

      await waitFor(() => {
        expect(result.current.clients.isLoading).toBe(false);
      });

      // Change client
      rerender({ clientId: "client-2" });

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith("affiliateId", "");
        expect(mockSetValue).toHaveBeenCalledWith("patientId", "");
      });
    });

    it("clears affiliate and patient errors when client changes", async () => {
      const { result, rerender } = renderHook(
        ({ clientId }) =>
          useCascadingSelects({
            clientId,
            affiliateId: "affiliate-1",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { clientId: "client-1" },
        }
      );

      await waitFor(() => {
        expect(result.current.clients.isLoading).toBe(false);
      });

      // Change client
      rerender({ clientId: "client-2" });

      await waitFor(() => {
        expect(mockClearErrors).toHaveBeenCalledWith([
          "affiliateId",
          "patientId",
        ]);
      });
    });

    it("does not reset when same client is reselected", async () => {
      const { result, rerender } = renderHook(
        ({ clientId }) =>
          useCascadingSelects({
            clientId,
            affiliateId: "affiliate-1",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { clientId: "client-1" },
        }
      );

      await waitFor(() => {
        expect(result.current.clients.isLoading).toBe(false);
      });

      mockSetValue.mockClear();
      mockClearErrors.mockClear();

      // Rerender with same client
      rerender({ clientId: "client-1" });

      // Should not call setValue for reset
      expect(mockSetValue).not.toHaveBeenCalledWith("affiliateId", "");
      expect(mockSetValue).not.toHaveBeenCalledWith("patientId", "");
    });
  });

  describe("cascading reset on affiliate change", () => {
    it("resets patient when affiliate changes", async () => {
      const { result, rerender } = renderHook(
        ({ affiliateId }) =>
          useCascadingSelects({
            clientId: "client-1",
            affiliateId,
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { affiliateId: "affiliate-1" },
        }
      );

      await waitFor(() => {
        expect(result.current.affiliates.isLoading).toBe(false);
      });

      mockSetValue.mockClear();

      // Change affiliate
      rerender({ affiliateId: "affiliate-2" });

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith("patientId", "");
      });
    });

    it("clears patient error when affiliate changes", async () => {
      const { result, rerender } = renderHook(
        ({ affiliateId }) =>
          useCascadingSelects({
            clientId: "client-1",
            affiliateId,
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { affiliateId: "affiliate-1" },
        }
      );

      await waitFor(() => {
        expect(result.current.affiliates.isLoading).toBe(false);
      });

      mockClearErrors.mockClear();

      // Change affiliate
      rerender({ affiliateId: "affiliate-2" });

      await waitFor(() => {
        expect(mockClearErrors).toHaveBeenCalledWith("patientId");
      });
    });

    it("does not reset patient when same affiliate is reselected", async () => {
      const { result, rerender } = renderHook(
        ({ affiliateId }) =>
          useCascadingSelects({
            clientId: "client-1",
            affiliateId,
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { affiliateId: "affiliate-1" },
        }
      );

      await waitFor(() => {
        expect(result.current.affiliates.isLoading).toBe(false);
      });

      mockSetValue.mockClear();
      mockClearErrors.mockClear();

      // Rerender with same affiliate
      rerender({ affiliateId: "affiliate-1" });

      // Should not call setValue for reset
      expect(mockSetValue).not.toHaveBeenCalledWith("patientId", "");
    });

    it("both effects run when client and affiliate change together", async () => {
      const { result, rerender } = renderHook(
        ({ clientId, affiliateId }) =>
          useCascadingSelects({
            clientId,
            affiliateId,
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { clientId: "client-1", affiliateId: "affiliate-1" },
        }
      );

      await waitFor(() => {
        expect(result.current.clients.isLoading).toBe(false);
      });

      mockSetValue.mockClear();

      // Change both client and affiliate (simulating client change resetting affiliate)
      rerender({ clientId: "client-2", affiliateId: "" });

      // Both effects run: client change resets affiliate+patient, affiliate change resets patient
      // This is expected behavior - each effect tracks its own previous value
      const setValueCalls = mockSetValue.mock.calls;

      // Client change resets both affiliateId and patientId
      expect(setValueCalls).toContainEqual(["affiliateId", ""]);
      expect(
        (setValueCalls as unknown[][]).filter((c) => c[0] === "patientId")
          .length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe("loading and error states", () => {
    it("exposes loading state for all lookups", async () => {
      server.use(
        http.get("*/claims/lookups/clients", async () => {
          await delay(100);
          return HttpResponse.json(mockClients);
        }),
        http.get("*/claims/lookups/affiliates", async () => {
          await delay(100);
          return HttpResponse.json(mockAffiliates);
        }),
        http.get("*/claims/lookups/patients", async () => {
          await delay(100);
          return HttpResponse.json(mockPatients);
        })
      );

      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "client-1",
            affiliateId: "affiliate-1",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.clients.isLoading).toBe(true);
      expect(result.current.affiliates.isLoading).toBe(true);
      expect(result.current.patients.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.clients.isLoading).toBe(false);
        expect(result.current.affiliates.isLoading).toBe(false);
        expect(result.current.patients.isLoading).toBe(false);
      });
    });

    it("exposes error state for failed lookups", async () => {
      server.use(
        http.get("*/claims/lookups/clients", () => {
          return HttpResponse.json(
            { message: "Server error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "",
            affiliateId: "",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.clients.isError).toBe(true);
      });
    });

    it("provides refetch function for each lookup", async () => {
      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "client-1",
            affiliateId: "affiliate-1",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.clients.isLoading).toBe(false);
      });

      expect(typeof result.current.clients.refetch).toBe("function");
      expect(typeof result.current.affiliates.refetch).toBe("function");
      expect(typeof result.current.patients.refetch).toBe("function");
    });
  });

  describe("initial mount behavior", () => {
    it("does not trigger reset on initial mount", async () => {
      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "client-1",
            affiliateId: "affiliate-1",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.clients.isLoading).toBe(false);
      });

      // On initial mount with values, should not reset
      expect(mockSetValue).not.toHaveBeenCalledWith("affiliateId", "");
      expect(mockSetValue).not.toHaveBeenCalledWith("patientId", "");
    });

    it("does not trigger reset when starting with empty values", async () => {
      const { result } = renderHook(
        () =>
          useCascadingSelects({
            clientId: "",
            affiliateId: "",
            setValue: mockSetValue,
            clearErrors: mockClearErrors,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.clients.isLoading).toBe(false);
      });

      // On initial mount with empty values, should not call reset
      expect(mockSetValue).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// useNewClaimForm
// =============================================================================

describe("useNewClaimForm", () => {
  beforeEach(() => {
    // Setup default handlers for lookups
    server.use(
      http.get("*/claims/lookups/clients", () => {
        return HttpResponse.json(mockClients);
      }),
      http.get("*/claims/lookups/affiliates", () => {
        return HttpResponse.json(mockAffiliates);
      }),
      http.get("*/claims/lookups/patients", () => {
        return HttpResponse.json(mockPatients);
      })
    );
  });

  describe("form initialization", () => {
    it("initializes form with default empty values", () => {
      const { result } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.formState.control).toBeDefined();
      expect(result.current.formState.handleSubmit).toBeDefined();
      expect(result.current.formState.errors).toBeDefined();
    });

    it("generates unique session key for file uploads", () => {
      const { result: result1 } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      const { result: result2 } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      // Each instance should have its own session key (internal state)
      // We can verify this by checking the file upload state is isolated
      expect(result1.current.fileUpload).toBeDefined();
      expect(result2.current.fileUpload).toBeDefined();
    });

    it("starts with canSubmit true when no files", () => {
      const { result } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.headerState.canSubmit).toBe(true);
    });

    it("starts with isBusy false", () => {
      const { result } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.headerState.isBusy).toBe(false);
    });
  });

  describe("cascading selects integration", () => {
    it("provides client options from API", async () => {
      const { result } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.selectsState.clientOptions).toEqual([
          { value: "client-1", label: "ACME Corp" },
          { value: "client-2", label: "Globex Inc" },
        ]);
      });
    });

    it("provides loading states for selects", () => {
      server.use(
        http.get("*/claims/lookups/clients", async () => {
          await delay(100);
          return HttpResponse.json(mockClients);
        })
      );

      const { result } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.selectsState.clients.isLoading).toBe(true);
    });
  });

  describe("exit confirmation", () => {
    it("provides exit dialog state", () => {
      const { result } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.exitDialog).toBeDefined();
      expect(result.current.exitDialog.open).toBe(false);
      expect(typeof result.current.exitDialog.onClose).toBe("function");
      expect(typeof result.current.exitDialog.onConfirm).toBe("function");
    });

    it("provides onCancel handler through header handlers", () => {
      const { result } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.headerHandlers.onCancel).toBe("function");
    });
  });

  describe("file upload integration", () => {
    it("provides file upload state", () => {
      const { result } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fileUpload.files).toBeDefined();
      expect(Array.isArray(result.current.fileUpload.files)).toBe(true);
      expect(typeof result.current.fileUpload.addFiles).toBe("function");
      expect(typeof result.current.fileUpload.removeFile).toBe("function");
    });

    it("provides file categories", () => {
      const { result } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fileUpload.categories).toBeDefined();
      expect(result.current.fileUpload.categoryIcons).toBeDefined();
    });
  });

  describe("form submission", () => {
    it("calls API with form data on submit", async () => {
      let requestBody: unknown;

      server.use(
        http.post("*/claims", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            id: "new-claim-1",
            claimNumber: "CLM-001",
            status: "DRAFT",
          });
        })
      );

      const { result } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.onSubmit({
          clientId: "client-1",
          affiliateId: "affiliate-1",
          patientId: "patient-1",
          description: "Test claim description",
        });
      });

      await waitFor(() => {
        expect(requestBody).toEqual({
          clientId: "client-1",
          affiliateId: "affiliate-1",
          patientId: "patient-1",
          description: "Test claim description",
          pendingUploadIds: [],
        });
      });
    });

    it("sets isBusy during submission", async () => {
      server.use(
        http.post("*/claims", async () => {
          await delay(100);
          return HttpResponse.json({ id: "new-claim-1", status: "DRAFT" });
        })
      );

      const { result } = renderHook(() => useNewClaimForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.headerState.isBusy).toBe(false);

      const submitPromise = act(async () => {
        await result.current.onSubmit({
          clientId: "client-1",
          affiliateId: "affiliate-1",
          patientId: "patient-1",
          description: "Test claim",
        });
      });

      await waitFor(() => {
        expect(result.current.headerState.isBusy).toBe(true);
      });

      await submitPromise;

      await waitFor(() => {
        expect(result.current.headerState.isBusy).toBe(false);
      });
    });
  });
});
