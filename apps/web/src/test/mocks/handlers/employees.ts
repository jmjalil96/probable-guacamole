import { http, HttpResponse } from "msw";
import {
  mockEmployees,
  mockEmployeeDetail,
  mockCreateEmployeeResponse,
} from "../data/employees";

const API_URL = "/api";

export const employeesHandlers = [
  // GET /employees
  http.get(`${API_URL}/employees`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 20;
    const isActive = url.searchParams.get("isActive");
    const hasAccount = url.searchParams.get("hasAccount");
    const search = url.searchParams.get("search");
    const department = url.searchParams.get("department");
    const sortBy = url.searchParams.get("sortBy") || "lastName";
    const sortOrder = url.searchParams.get("sortOrder") || "asc";

    let filteredEmployees = [...mockEmployees];

    // Filter by isActive
    if (isActive !== null) {
      const activeValue = isActive === "true";
      filteredEmployees = filteredEmployees.filter(
        (e) => e.isActive === activeValue
      );
    }

    // Filter by hasAccount
    if (hasAccount !== null) {
      const hasAccountValue = hasAccount === "true";
      filteredEmployees = filteredEmployees.filter(
        (e) => e.hasAccount === hasAccountValue
      );
    }

    // Filter by department
    if (department) {
      filteredEmployees = filteredEmployees.filter(
        (e) => e.department === department
      );
    }

    // Filter by search (firstName, lastName, email)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEmployees = filteredEmployees.filter(
        (e) =>
          e.firstName.toLowerCase().includes(searchLower) ||
          e.lastName.toLowerCase().includes(searchLower) ||
          e.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filteredEmployees.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a] ?? "";
      const bValue = b[sortBy as keyof typeof b] ?? "";
      const comparison = String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
      });
      return sortOrder === "desc" ? -comparison : comparison;
    });

    const total = filteredEmployees.length;
    const start = (page - 1) * limit;
    const paginatedEmployees = filteredEmployees.slice(start, start + limit);

    return HttpResponse.json({
      data: paginatedEmployees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),

  // GET /employees/:id
  http.get(`${API_URL}/employees/:id`, ({ params }) => {
    const { id } = params;

    if (id === "not-found") {
      return HttpResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Employee not found",
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...mockEmployeeDetail,
      id: id as string,
    });
  }),

  // POST /employees
  http.post(`${API_URL}/employees`, async ({ request }) => {
    const body = (await request.json()) as { email?: string };

    // Simulate uniqueness validation error
    if (body.email === "duplicate@example.com") {
      return HttpResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "An employee with this email already exists",
          },
        },
        { status: 409 }
      );
    }

    return HttpResponse.json(mockCreateEmployeeResponse, { status: 201 });
  }),

  // PATCH /employees/:id
  http.patch(`${API_URL}/employees/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();

    return HttpResponse.json({
      ...mockEmployeeDetail,
      id: id as string,
      ...(body as object),
    });
  }),

  // DELETE /employees/:id
  http.delete(`${API_URL}/employees/:id`, ({ params }) => {
    const { id } = params;

    if (id === "employee-with-account") {
      return HttpResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "Cannot delete employee with associated account",
          },
        },
        { status: 409 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
