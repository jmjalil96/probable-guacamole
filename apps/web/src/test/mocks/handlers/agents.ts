import { http, HttpResponse } from "msw";
import {
  mockAgents,
  mockAgentDetail,
  mockCreateAgentResponse,
  mockAgentClients,
  mockAssignAgentClientResponse,
} from "../data/agents";

const API_URL = "/api";

export const agentsHandlers = [
  // ==========================================================================
  // Agent CRUD
  // ==========================================================================

  // GET /agents
  http.get(`${API_URL}/agents`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 20;
    const isActive = url.searchParams.get("isActive");
    const hasAccount = url.searchParams.get("hasAccount");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") || "lastName";
    const sortOrder = url.searchParams.get("sortOrder") || "asc";

    let filteredAgents = [...mockAgents];

    // Filter by isActive
    if (isActive !== null) {
      const activeValue = isActive === "true";
      filteredAgents = filteredAgents.filter((a) => a.isActive === activeValue);
    }

    // Filter by hasAccount
    if (hasAccount !== null) {
      const hasAccountValue = hasAccount === "true";
      filteredAgents = filteredAgents.filter(
        (a) => a.hasAccount === hasAccountValue
      );
    }

    // Filter by search (firstName, lastName, email, agencyName)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAgents = filteredAgents.filter(
        (a) =>
          a.firstName.toLowerCase().includes(searchLower) ||
          a.lastName.toLowerCase().includes(searchLower) ||
          a.email.toLowerCase().includes(searchLower) ||
          (a.agencyName && a.agencyName.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    filteredAgents.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a] ?? "";
      const bValue = b[sortBy as keyof typeof b] ?? "";
      const comparison = String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
      });
      return sortOrder === "desc" ? -comparison : comparison;
    });

    const total = filteredAgents.length;
    const start = (page - 1) * limit;
    const paginatedAgents = filteredAgents.slice(start, start + limit);

    return HttpResponse.json({
      data: paginatedAgents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),

  // GET /agents/:id
  http.get(`${API_URL}/agents/:id`, ({ params }) => {
    const { id } = params;

    if (id === "not-found") {
      return HttpResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Agent not found",
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...mockAgentDetail,
      id: id as string,
    });
  }),

  // POST /agents
  http.post(`${API_URL}/agents`, async ({ request }) => {
    const body = (await request.json()) as { email?: string };

    // Simulate uniqueness validation error
    if (body.email === "duplicate@agency.com") {
      return HttpResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "An agent with this email already exists",
          },
        },
        { status: 409 }
      );
    }

    return HttpResponse.json(mockCreateAgentResponse, { status: 201 });
  }),

  // PATCH /agents/:id
  http.patch(`${API_URL}/agents/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();

    return HttpResponse.json({
      ...mockAgentDetail,
      id: id as string,
      ...(body as object),
    });
  }),

  // DELETE /agents/:id
  http.delete(`${API_URL}/agents/:id`, ({ params }) => {
    const { id } = params;

    if (id === "agent-with-clients") {
      return HttpResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "Cannot delete agent with associated clients",
          },
        },
        { status: 409 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // ==========================================================================
  // Agent Clients
  // ==========================================================================

  // GET /agents/:agentId/clients
  http.get(`${API_URL}/agents/:agentId/clients`, ({ params }) => {
    const { agentId } = params;

    if (agentId === "not-found") {
      return HttpResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Agent not found",
          },
        },
        { status: 404 }
      );
    }

    if (agentId === "agent-empty") {
      return HttpResponse.json({ data: [] });
    }

    return HttpResponse.json({ data: mockAgentClients });
  }),

  // POST /agents/:agentId/clients/:clientId
  http.post(`${API_URL}/agents/:agentId/clients/:clientId`, ({ params }) => {
    const { agentId, clientId } = params;

    if (agentId === "not-found") {
      return HttpResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Agent not found",
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
            message: "Client is already assigned to this agent",
          },
        },
        { status: 409 }
      );
    }

    return HttpResponse.json(
      {
        ...mockAssignAgentClientResponse,
        agentId: agentId as string,
        clientId: clientId as string,
      },
      { status: 201 }
    );
  }),

  // DELETE /agents/:agentId/clients/:clientId
  http.delete(`${API_URL}/agents/:agentId/clients/:clientId`, ({ params }) => {
    const { agentId, clientId } = params;

    if (agentId === "not-found") {
      return HttpResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Agent not found",
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
            message: "Client is not assigned to this agent",
          },
        },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
