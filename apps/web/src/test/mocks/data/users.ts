import type { MeResponse } from "shared";

export interface MockUser {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  name: {
    firstName: string;
    lastName: string;
  } | null;
  role: string;
  permissions: string[];
}

export const mockUsers: MockUser[] = [
  {
    id: "user-1",
    email: "admin@example.com",
    emailVerifiedAt: "2024-01-01T00:00:00Z",
    name: {
      firstName: "Admin",
      lastName: "User",
    },
    role: "admin",
    permissions: [
      "claims:read",
      "claims:create",
      "claims:update",
      "claims:delete",
      "claims:transition",
      "users:read",
      "users:create",
    ],
  },
  {
    id: "user-2",
    email: "agent@example.com",
    emailVerifiedAt: "2024-01-01T00:00:00Z",
    name: {
      firstName: "Agent",
      lastName: "User",
    },
    role: "agent",
    permissions: ["claims:read", "claims:create", "claims:update"],
  },
  {
    id: "user-3",
    email: "viewer@example.com",
    emailVerifiedAt: "2024-01-01T00:00:00Z",
    name: {
      firstName: "Viewer",
      lastName: "User",
    },
    role: "viewer",
    permissions: ["claims:read"],
  },
];

export const mockAuthenticatedUser: MeResponse = mockUsers[0] as MeResponse;
