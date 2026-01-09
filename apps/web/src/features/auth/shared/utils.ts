import { isApiError } from "@/lib/api";

// =============================================================================
// Types
// =============================================================================

export type AuthErrorContext =
  | "login"
  | "forgot-password"
  | "reset-password"
  | "accept-invitation";

// =============================================================================
// Error Messages
// =============================================================================

const GENERIC_ERROR =
  "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
const NETWORK_ERROR = "Error de conexión. Por favor, intenta de nuevo.";

/**
 * Unified error message handler for auth flows.
 * Provides context-specific messages for common error scenarios.
 */
export function getAuthErrorMessage(
  error: Error | null,
  context: AuthErrorContext
): string | null {
  if (!error) return null;

  if (isApiError(error)) {
    // Network errors
    if (error.isNetworkError) {
      return NETWORK_ERROR;
    }

    // Context-specific error handling
    switch (context) {
      case "login":
        if (error.isUnauthorized) {
          return "Credenciales inválidas. Por favor, verifica tu correo y contraseña.";
        }
        break;

      case "reset-password":
        if (error.isNotFound) {
          return "El enlace ha expirado o ya fue utilizado.";
        }
        break;

      case "accept-invitation":
        if (error.isNotFound) {
          return "La invitación ha expirado o ya fue utilizada.";
        }
        if (error.code === "CONFLICT") {
          return "Este correo ya está registrado o la cuenta ya fue activada.";
        }
        break;
    }

    // Return API error message if available
    return error.message;
  }

  return GENERIC_ERROR;
}
