import { toast } from "@/lib/utils";
import { isApiError } from "./errors";

// =============================================================================
// Types
// =============================================================================

export interface MutationErrorResult {
  title: string;
  description?: string;
  items?: string[];
}

export interface HandleMutationErrorOptions {
  /** Called with parsed error for form display */
  onFormError?: (error: MutationErrorResult) => void;
  /** Custom message for unexpected errors */
  unexpectedMessage?: string;
  /** Custom message for network errors */
  networkMessage?: string;
  /** Custom message for auth errors */
  authMessage?: string;
  /** Skip showing toast (caller will handle) */
  skipToast?: boolean;
}

// =============================================================================
// Handler
// =============================================================================

/**
 * Standardized mutation error handler.
 * Handles all common error cases with consistent toast messages.
 *
 * @example
 * ```ts
 * try {
 *   await createClaim.mutateAsync(data);
 *   toast.success("Reclamo creado");
 * } catch (error) {
 *   handleMutationError(error);
 * }
 * ```
 *
 * @example
 * ```ts
 * // With form error callback
 * try {
 *   await updateClaim.mutateAsync(data);
 * } catch (error) {
 *   handleMutationError(error, {
 *     onFormError: (err) => setFormError(err),
 *   });
 * }
 * ```
 */
export function handleMutationError(
  error: unknown,
  options: HandleMutationErrorOptions = {}
): MutationErrorResult {
  const {
    onFormError,
    unexpectedMessage = "Error inesperado",
    networkMessage = "Sin conexión",
    authMessage = "Sesión expirada",
    skipToast = false,
  } = options;

  // Unknown error type
  if (!isApiError(error)) {
    const description = "Intente nuevamente";
    const result: MutationErrorResult = {
      title: unexpectedMessage,
      description,
    };
    if (!skipToast) {
      toast.error(result.title, { description });
    }
    onFormError?.(result);
    return result;
  }

  // Network error
  if (error.isNetworkError) {
    const description = "Verifique su conexión a internet";
    const result: MutationErrorResult = {
      title: networkMessage,
      description,
    };
    if (!skipToast) {
      toast.error(result.title, { description });
    }
    onFormError?.(result);
    return result;
  }

  // Auth error
  if (error.isUnauthorized) {
    const description = "Por favor inicie sesión nuevamente";
    const result: MutationErrorResult = {
      title: authMessage,
      description,
    };
    if (!skipToast) {
      toast.error(result.title, { description });
    }
    onFormError?.(result);
    return result;
  }

  // Build items from field errors if available
  let items: string[] | undefined;
  if (error.details?.fieldErrors) {
    items = Object.entries(error.details.fieldErrors).flatMap(
      ([field, errors]) => errors.map((msg) => `${field}: ${msg}`)
    );
  } else if (error.details?.formErrors?.length) {
    items = error.details.formErrors;
  }

  // Validation or other API error
  const result: MutationErrorResult = {
    title: error.message || "Error en la operación",
  };

  if (items && items.length > 0) {
    result.items = items;
  }

  if (!skipToast) {
    const toastDescription = items ? items.join(", ") : undefined;
    if (toastDescription) {
      toast.error(result.title, { description: toastDescription });
    } else {
      toast.error(result.title);
    }
  }
  onFormError?.(result);
  return result;
}
