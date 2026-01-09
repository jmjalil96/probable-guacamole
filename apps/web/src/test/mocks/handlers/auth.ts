import { http, HttpResponse } from "msw";
import { mockUsers, mockAuthenticatedUser } from "../data/users";

const API_URL = "/api";

export const authHandlers = [
  // GET /auth/me
  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json(mockAuthenticatedUser);
  }),

  // POST /auth/login
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    const user = mockUsers.find((u) => u.email === body.email);

    if (!user || body.password !== "password123") {
      return HttpResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Credenciales inválidas",
          },
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    });
  }),

  // POST /auth/logout
  http.post(`${API_URL}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /auth/logout-all
  http.post(`${API_URL}/auth/logout-all`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /auth/password-reset/request
  http.post(`${API_URL}/auth/password-reset/request`, () => {
    return HttpResponse.json({
      message:
        "Si el correo existe, recibirás instrucciones para restablecer tu contraseña",
    });
  }),

  // GET /auth/password-reset/:token
  http.get(`${API_URL}/auth/password-reset/:token`, ({ params }) => {
    const { token } = params;

    if (token === "invalid-token") {
      return HttpResponse.json(
        {
          error: {
            code: "INVALID_TOKEN",
            message: "Token inválido o expirado",
          },
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      valid: true,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  }),

  // POST /auth/password-reset/confirm
  http.post(`${API_URL}/auth/password-reset/confirm`, () => {
    return HttpResponse.json({
      message: "Contraseña actualizada exitosamente",
    });
  }),
];
