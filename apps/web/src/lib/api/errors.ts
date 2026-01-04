export interface ApiErrorDetails {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details: ApiErrorDetails | undefined;
  requestId: string | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorDetails,
    requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidationError() {
    return this.code === "VALIDATION_ERROR";
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
