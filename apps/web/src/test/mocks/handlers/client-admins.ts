import { http, HttpResponse } from "msw";
import {
  mockClientAdmins,
  mockClientAdminDetail,
  mockCreateClientAdminResponse,
  mockClientAdminClients,
  mockAssignClientAdminClientResponse,
} from "../data/client-admins";

const API_URL = "/api";

export const clientAdminsHandlers = [
  // ==========================================================================
  // Client Admin CRUD
  // ==========================================================================

  // GET /client-admins
  http.get(`${API_URL}/client-admins`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 20;
    const isActive = url.searchParams.get("isActive");
    const hasAccount = url.searchParams.get("hasAccount");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") || "lastName";
    const sortOrder = url.searchParams.get("sortOrder") || "asc";

    let filteredClientAdmins = [...mockClientAdmins];

    // Filter by isActive
    if (isActive !== null) {
      const activeValue = isActive === "true";
      filteredClientAdmins = filteredClientAdmins.filter(
        (ca) => ca.isActive === activeValue
      );
    }

    // Filter by hasAccount
    if (hasAccount !== null) {
      const hasAccountValue = hasAccount === "true";
      filteredClientAdmins = filteredClientAdmins.filter(
        (ca) => ca.hasAccount === hasAccountValue
      );
    }

    // Filter by search (firstName, lastName, email, jobTitle)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredClientAdmins = filteredClientAdmins.filter(
        (ca) =>
          ca.firstName.toLowerCase().includes(searchLower) ||
          ca.lastName.toLowerCase().includes(searchLower) ||
          ca.email.toLowerCase().includes(searchLower) ||
          (ca.jobTitle && ca.jobTitle.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    filteredClientAdmins.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a] ?? "";
      const bValue = b[sortBy as keyof typeof b] ?? "";
      const comparison = String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
      });
      return sortOrder === "desc" ? -comparison : comparison;
    });

    const total = filteredClientAdmins.length;
    const start = (page - 1) * limit;
    const paginatedClientAdmins = filteredClientAdmins.slice(start, start + limit);

    return HttpResponse.json({
      data: paginatedClientAdmins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),

  // GET /client-admins/:id
  http.get(`${API_URL}/client-admins/:id`, ({ params }) => {
    const { id } = params;

    if (id === "not-found") {
      return HttpResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Client admin not found",
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...mockClientAdminDetail,
      id: id as string,
    });
  }),

  // POST /client-admins
  http.post(`${API_URL}/client-admins`, async ({ request }) => {
    const body = (await request.json()) as { email?: string };

    // Simulate uniqueness validation error
    if (body.email === "duplicate@client.com") {
      return HttpResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "A client admin with this email already exists",
          },
        },
        { status: 409 }
      );
    }

    return HttpResponse.json(mockCreateClientAdminResponse, { status: 201 });
  }),

  // PATCH /client-admins/:id
  http.patch(`${API_URL}/client-admins/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();

    return HttpResponse.json({
      ...mockClientAdminDetail,
      id: id as string,
      ...(body as object),
    });
  }),

  // DELETE /client-admins/:id
  http.delete(`${API_URL}/client-admins/:id`, ({ params }) => {
    const { id } = params;

    if (id === "client-admin-with-clients") {
      return HttpResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "Cannot delete client admin with associated clients",
          },
        },
        { status: 409 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // ==========================================================================
  // Client Admin Clients
  // ==========================================================================

  // GET /client-admins/:clientAdminId/clients
  http.get(`${API_URL}/client-admins/:clientAdminId/clients`, ({ params }) => {
    const { clientAdminId } = params;

    if (clientAdminId === "not-found") {
      return HttpResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Client admin not found",
          },
        },
        { status: 404 }
      );
    }

    if (clientAdminId === "client-admin-empty") {
      return HttpResponse.json({ data: [] });
    }

    return HttpResponse.json({ data: mockClientAdminClients });
  }),

  // POST /client-admins/:clientAdminId/clients/:clientId
  http.post(
    `${API_URL}/client-admins/:clientAdminId/clients/:clientId`,
    ({ params }) => {
      const { clientAdminId, clientId } = params;

      if (clientAdminId === "not-found") {
        return HttpResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Client admin not found",
            },
          },
          { status: 404 }
        );
      }

      if (clientId === "not-found") {
        return HttpResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Client not found",
            },
          },
          { status: 404 }
        );
      }

      if (clientId === "already-assigned") {
        return HttpResponse.json(
          {
            error: {
              code: "CONFLICT",
              message: "Client is already assigned to this client admin",
            },
          },
          { status: 409 }
        );
      }

      return HttpResponse.json(
        {
          ...mockAssignClientAdminClientResponse,
          clientAdminId: clientAdminId as string,
          clientId: clientId as string,
        },
        { status: 201 }
      );
    }
  ),

  // DELETE /client-admins/:clientAdminId/clients/:clientId
  http.delete(
    `${API_URL}/client-admins/:clientAdminId/clients/:clientId`,
    ({ params }) => {
      const { clientAdminId, clientId } = params;

      if (clientAdminId === "not-found") {
        return HttpResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Client admin not found",
            },
          },
          { status: 404 }
        );
      }

      if (clientId === "not-assigned") {
        return HttpResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Client is not assigned to this client admin",
            },
          },
          { status: 404 }
        );
      }

      return new HttpResponse(null, { status: 204 });
    }
  ),
];
