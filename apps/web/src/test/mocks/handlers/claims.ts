import { http, HttpResponse } from "msw";
import { mockClaims, mockClaimDetail } from "../data/claims";

const API_URL = "/api";

export const claimsHandlers = [
  // GET /claims
  http.get(`${API_URL}/claims`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 20;
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    let filteredClaims = [...mockClaims];

    if (status) {
      const statuses = status.split(",");
      filteredClaims = filteredClaims.filter((c) =>
        statuses.includes(c.status)
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredClaims = filteredClaims.filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(searchLower) ||
          c.patientName.toLowerCase().includes(searchLower)
      );
    }

    const total = filteredClaims.length;
    const start = (page - 1) * limit;
    const paginatedClaims = filteredClaims.slice(start, start + limit);

    return HttpResponse.json({
      data: paginatedClaims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),

  // GET /claims/:id
  http.get(`${API_URL}/claims/:id`, ({ params }) => {
    const { id } = params;

    if (id === "not-found") {
      return HttpResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Reclamo no encontrado",
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...mockClaimDetail,
      id: id as string,
    });
  }),

  // POST /claims
  http.post(`${API_URL}/claims`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json(
      {
        id: "new-claim-id",
        claimNumber: "CLM-2024-0100",
        ...(body as object),
      },
      { status: 201 }
    );
  }),

  // PATCH /claims/:id
  http.patch(`${API_URL}/claims/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();

    return HttpResponse.json({
      ...mockClaimDetail,
      id: id as string,
      ...(body as object),
    });
  }),

  // Claim transitions
  http.post(`${API_URL}/claims/:id/submit`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      status: "SUBMITTED",
      previousStatus: "DRAFT",
    });
  }),

  http.post(`${API_URL}/claims/:id/review`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      status: "IN_REVIEW",
      previousStatus: "SUBMITTED",
    });
  }),

  // Lookups
  http.get(`${API_URL}/claims/lookups/clients`, () => {
    return HttpResponse.json({
      data: [
        { id: "client-1", name: "ACME Corp" },
        { id: "client-2", name: "Globex Inc" },
        { id: "client-3", name: "Initech" },
      ],
    });
  }),

  http.get(`${API_URL}/claims/lookups/affiliates`, ({ request }) => {
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");

    if (!clientId) {
      return HttpResponse.json({ data: [] });
    }

    return HttpResponse.json({
      data: [
        {
          id: "affiliate-1",
          firstName: "Sucursal",
          lastName: "Norte",
          name: "Sucursal Norte",
        },
        {
          id: "affiliate-2",
          firstName: "Sucursal",
          lastName: "Sur",
          name: "Sucursal Sur",
        },
      ],
    });
  }),

  http.get(`${API_URL}/claims/lookups/patients`, ({ request }) => {
    const url = new URL(request.url);
    const affiliateId = url.searchParams.get("affiliateId");

    if (!affiliateId) {
      return HttpResponse.json({ data: [] });
    }

    return HttpResponse.json({
      data: [
        {
          id: "patient-1",
          firstName: "John",
          lastName: "Doe",
          name: "John Doe",
          relationship: "TITULAR",
        },
        {
          id: "patient-2",
          firstName: "Jane",
          lastName: "Doe",
          name: "Jane Doe",
          relationship: "SPOUSE",
        },
      ],
    });
  }),
];
