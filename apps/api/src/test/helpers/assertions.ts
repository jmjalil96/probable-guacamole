import { expect } from "vitest";
import type { Response } from "supertest";
import { SESSION_COOKIE_NAME } from "../../features/auth/constants.js";

interface ErrorResponseBody {
  error: {
    message: string;
    code: string;
    requestId: string;
  };
}

/**
 * Assert that a response contains valid session cookie.
 */
export function expectSessionCookie(res: Response): string {
  const cookies = res.headers["set-cookie"] as string[] | string | undefined;
  expect(cookies).toBeDefined();

  const cookieArray = Array.isArray(cookies) ? cookies : [cookies!];
  const sessionCookie = cookieArray.find((c: string) =>
    c.startsWith(`${SESSION_COOKIE_NAME}=`)
  );

  expect(sessionCookie).toBeDefined();
  expect(sessionCookie).toContain("HttpOnly");
  expect(sessionCookie).toContain("Path=/");
  expect(sessionCookie).toContain("SameSite=Lax");

  return sessionCookie!;
}

/**
 * Assert standard error response shape.
 */
export function expectErrorResponse(
  res: Response,
  statusCode: number,
  code: string
) {
  expect(res.status).toBe(statusCode);
  const body = res.body as ErrorResponseBody;
  expect(body).toHaveProperty("error");
  expect(body.error).toHaveProperty("message");
  expect(body.error).toHaveProperty("code", code);
  expect(body.error).toHaveProperty("requestId");
}

/**
 * Assert unauthorized response (generic for security).
 */
export function expectUnauthorized(res: Response) {
  expectErrorResponse(res, 401, "UNAUTHORIZED");
  const body = res.body as ErrorResponseBody;
  expect(body.error.message).toBe("Invalid credentials");
}

/**
 * Assert that session cookie has been cleared.
 */
export function expectCookieCleared(res: Response): void {
  const cookies = res.headers["set-cookie"] as string[] | string | undefined;
  expect(cookies).toBeDefined();

  const cookieArray = Array.isArray(cookies) ? cookies : [cookies!];
  const sessionCookie = cookieArray.find((c: string) =>
    c.startsWith(`${SESSION_COOKIE_NAME}=`)
  );

  expect(sessionCookie).toBeDefined();
  // Cookie should have empty value (sid=;) indicating it was cleared
  expect(sessionCookie).toContain(`${SESSION_COOKIE_NAME}=;`);
}

/**
 * Assert not found response with specific error code.
 */
export function expectNotFound(res: Response, code: string) {
  expectErrorResponse(res, 404, code);
}
