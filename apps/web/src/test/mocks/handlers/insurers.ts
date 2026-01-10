import { http, HttpResponse } from "msw";
import {
  mockInsurers,
  mockInsurerDetail,
  mockCreateInsurerResponse,
} from "../data/insurers";

const API_URL = "/api";

export const insurersHandlers = [
  // GET /insurers
  http.get(`${API_URL}/insurers`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 20;
    const type = url.searchParams.get("type");
    const isActive = url.searchParams.get("isActive");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") || "name";
    const sortOrder = url.searchParams.get("sortOrder") || "asc";

    let filteredInsurers = [...mockInsurers];

    // Filter by type
    if (type) {
      filteredInsurers = filteredInsurers.filter((i) => i.type === type);
    }

    // Filter by isActive
    if (isActive !== null) {
      const activeValue = isActive === "true";
      filteredInsurers = filteredInsurers.filter(
        (i) => i.isActive === activeValue
      );
    }

    // Filter by search (name or code)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInsurers = filteredInsurers.filter(
        (i) =>
          i.name.toLowerCase().includes(searchLower) ||
          (i.code && i.code.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    filteredInsurers.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a] ?? "";
      const bValue = b[sortBy as keyof typeof b] ?? "";
      const comparison =
        String(aValue).localeCompare(String(bValue), undefined, {
          numeric: true,
        });
      return sortOrder === "desc" ? -comparison : comparison;
    });

    const total = filteredInsurers.length;
    const start = (page - 1) * limit;
    const paginatedInsurers = filteredInsurers.slice(start, start + limit);

    return HttpResponse.json({
      data: paginatedInsurers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),

  // GET /insurers/:id
  http.get(`${API_URL}/insurers/:id`, ({ params }) => {
    const { id } = params;

    if (id === "not-found") {
      return HttpResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Aseguradora no encontrada",
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...mockInsurerDetail,
      id: id as string,
    });
  }),

  // POST /insurers
  http.post(`${API_URL}/insurers`, async ({ request }) => {
    const body = (await request.json()) as { name?: string };

    // Simulate uniqueness validation error
    if (body.name === "Duplicate Name") {
      return HttpResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "An insurer with this name already exists",
          },
        },
        { status: 409 }
      );
    }

    return HttpResponse.json(mockCreateInsurerResponse, { status: 201 });
  }),

  // PATCH /insurers/:id
  http.patch(`${API_URL}/insurers/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();

    return HttpResponse.json({
      ...mockInsurerDetail,
      id: id as string,
      ...(body as object),
    });
  }),

  // DELETE /insurers/:id
  http.delete(`${API_URL}/insurers/:id`, ({ params }) => {
    const { id } = params;

    // Simulate constraint error for insurer with policies
    if (id === "insurer-with-policies") {
      return HttpResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "Cannot delete insurer with associated policies",
          },
        },
        { status: 409 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
