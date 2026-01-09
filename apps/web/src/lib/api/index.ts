export { api } from "./client";
export { ApiError, isApiError, type ApiErrorDetails } from "./errors";
export { queryClient } from "./query-client";
export {
  handleMutationError,
  type MutationErrorResult,
  type HandleMutationErrorOptions,
} from "./mutation-error-handler";
