import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../../config/db.js";
import { createTestApp } from "../../../../test/helpers/index.js";
import { cleanDatabase } from "../../../../test/db-utils.js";
import {
  seedRoleWithClaimsPermission,
  seedRoleWithClaimsReadAndEditPermission,
  seedRoleWithoutPermission,
  createTestUser,
  createTestSession,
  createTestClient,
  createTestAffiliate,
  createTestEmployee,
  createTestClaim,
  createTestNote,
  resetClaimNumberCounter,
  SESSION_COOKIE_NAME,
} from "../../__tests__/fixtures.js";

interface NoteResponse {
  id: string;
  entityType: string;
  entityId: string;
  content: string;
  isInternal: boolean;
  isEdited: boolean;
  createdBy: { id: string; name: string };
  updatedBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ListNotesResponse {
  data: NoteResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    requestId?: string;
  };
}

const asNoteResponse = (body: unknown): NoteResponse => body as NoteResponse;

const asListResponse = (body: unknown): ListNotesResponse =>
  body as ListNotesResponse;

const asErrorResponse = (body: unknown): ErrorResponse =>
  body as ErrorResponse;

describe("Claim Notes API", () => {
  const app = createTestApp();

  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testAffiliate: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testClaim: Awaited<ReturnType<typeof createTestClaim>>;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let testEmployee: Awaited<ReturnType<typeof createTestEmployee>>;
  let sessionToken: string;

  async function setupReadUser() {
    const role = await seedRoleWithClaimsPermission("UNLIMITED");
    const employee = await createTestEmployee();
    const user = await createTestUser(role.id);
    await db.employee.update({
      where: { id: employee.id },
      data: { userId: user.id },
    });
    const { token } = await createTestSession(user.id);
    return { user, employee, token };
  }

  beforeEach(async () => {
    await cleanDatabase();
    await resetClaimNumberCounter();

    testClient = await createTestClient("Test Client");
    testAffiliate = await createTestAffiliate(testClient.id, {
      firstName: "John",
      lastName: "Doe",
    });

    const role = await seedRoleWithClaimsReadAndEditPermission("UNLIMITED");
    testEmployee = await createTestEmployee({ firstName: "Admin", lastName: "User" });
    testUser = await createTestUser(role.id);
    await db.employee.update({
      where: { id: testEmployee.id },
      data: { userId: testUser.id },
    });

    const session = await createTestSession(testUser.id);
    sessionToken = session.token;

    testClaim = await createTestClaim({
      clientId: testClient.id,
      affiliateId: testAffiliate.id,
      patientId: testAffiliate.id,
      createdById: testUser.id,
      status: "DRAFT",
    });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ===========================================================================
  // GET /claims/:claimId/notes - List Notes
  // ===========================================================================

  describe("GET /claims/:claimId/notes - List Notes", () => {
    it("should return empty array when no notes exist", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toHaveLength(0);
      expect(body.pagination.total).toBe(0);
    });

    it("should return all notes for a claim", async () => {
      await createTestNote({ entityId: testClaim.id, createdById: testUser.id });
      await createTestNote({ entityId: testClaim.id, createdById: testUser.id });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toHaveLength(2);
    });

    it("should return notes ordered by createdAt desc by default", async () => {
      const first = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "First note",
      });

      await new Promise((r) => setTimeout(r, 10));

      const second = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "Second note",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data[0]!.id).toBe(second.id);
      expect(body.data[1]!.id).toBe(first.id);
    });

    it("should support sortOrder asc", async () => {
      const first = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "First note",
      });

      await new Promise((r) => setTimeout(r, 10));

      const second = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "Second note",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes?sortOrder=asc`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data[0]!.id).toBe(first.id);
      expect(body.data[1]!.id).toBe(second.id);
    });

    it("should support pagination", async () => {
      for (let i = 0; i < 5; i++) {
        await createTestNote({
          entityId: testClaim.id,
          createdById: testUser.id,
          content: `Note ${i}`,
        });
      }

      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes?page=1&limit=2`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(2);
      expect(body.pagination.total).toBe(5);
      expect(body.pagination.totalPages).toBe(3);
    });

    it("should filter internal notes by default", async () => {
      await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "Public note",
        isInternal: false,
      });
      await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "Internal note",
        isInternal: true,
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.content).toBe("Public note");
    });

    it("should include internal notes when includeInternal=true", async () => {
      await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "Public note",
        isInternal: false,
      });
      await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "Internal note",
        isInternal: true,
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes?includeInternal=true`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toHaveLength(2);
    });

    it("should return 404 for non-existent claim", async () => {
      const res = await request(app)
        .get("/claims/nonexistent-claim-id/notes")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 401 without auth", async () => {
      const res = await request(app).get(`/claims/${testClaim.id}/notes`);

      expect(res.status).toBe(401);
    });

    it("should return 403 without claims:read permission", async () => {
      const role = await seedRoleWithoutPermission("UNLIMITED");
      const user = await createTestUser(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
    });

    it("should return 403 without UNLIMITED scope", async () => {
      const role = await seedRoleWithClaimsPermission("CLIENT");
      const user = await createTestUser(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // GET /claims/:claimId/notes/:noteId - Get Single Note
  // ===========================================================================

  describe("GET /claims/:claimId/notes/:noteId - Get Single Note", () => {
    it("should return single note with all fields", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "Test note content",
        isInternal: false,
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asNoteResponse(res.body);
      expect(body.id).toBe(note.id);
      expect(body.content).toBe("Test note content");
      expect(body.isInternal).toBe(false);
      expect(body.isEdited).toBe(false);
      expect(body.createdBy.id).toBe(testUser.id);
      expect(body.createdBy.name).toBe("Admin User");
    });

    it("should return 404 for non-existent note", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes/nonexistent-note-id`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 when note belongs to different claim", async () => {
      const otherClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testAffiliate.id,
        createdById: testUser.id,
      });

      const note = await createTestNote({
        entityId: otherClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent claim", async () => {
      const res = await request(app)
        .get("/claims/nonexistent-claim-id/notes/some-note-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // POST /claims/:claimId/notes - Create Note
  // ===========================================================================

  describe("POST /claims/:claimId/notes - Create Note", () => {
    it("should create note and return 201", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "This is a new note",
        });

      expect(res.status).toBe(201);
      const body = asNoteResponse(res.body);
      expect(body.id).toBeDefined();
      expect(body.entityType).toBe("Claim");
      expect(body.entityId).toBe(testClaim.id);
      expect(body.content).toBe("This is a new note");
      expect(body.isInternal).toBe(false);
      expect(body.isEdited).toBe(false);
    });

    it("should store note in database", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Database test note",
        });

      expect(res.status).toBe(201);

      const note = await db.note.findUnique({
        where: { id: asNoteResponse(res.body).id },
      });
      expect(note).not.toBeNull();
      expect(note!.content).toBe("Database test note");
    });

    it("should create internal note when isInternal=true", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Internal staff note",
          isInternal: true,
        });

      expect(res.status).toBe(201);
      const body = asNoteResponse(res.body);
      expect(body.isInternal).toBe(true);
    });

    it("should default isInternal to false", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Default note",
        });

      expect(res.status).toBe(201);
      const body = asNoteResponse(res.body);
      expect(body.isInternal).toBe(false);
    });

    it("should return 400 for claim in SETTLED status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "SETTLED" },
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Should fail",
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("SETTLED");
    });

    it("should return 400 for claim in CANCELLED status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "CANCELLED" },
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Should fail",
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("CANCELLED");
    });

    it("should return 400 for claim in RETURNED status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "RETURNED" },
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Should fail",
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("RETURNED");
    });

    it("should allow creation for claim in IN_REVIEW status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "IN_REVIEW" },
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Note on in-review claim",
        });

      expect(res.status).toBe(201);
    });

    it("should return 404 for non-existent claim", async () => {
      const res = await request(app)
        .post("/claims/nonexistent-claim-id/notes")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Should fail",
        });

      expect(res.status).toBe(404);
    });

    it("should return 400 for missing content", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should return 400 for empty content", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 for content exceeding max length", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "a".repeat(10001),
        });

      expect(res.status).toBe(400);
    });

    it("should return 401 without auth", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .send({
          content: "Should fail",
        });

      expect(res.status).toBe(401);
    });

    it("should return 403 without claims:edit permission", async () => {
      const { token } = await setupReadUser();

      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`)
        .send({
          content: "Should fail",
        });

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // PATCH /claims/:claimId/notes/:noteId - Update Note
  // ===========================================================================

  describe("PATCH /claims/:claimId/notes/:noteId - Update Note", () => {
    it("should update content field", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "Original content",
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Updated content",
        });

      expect(res.status).toBe(200);
      const body = asNoteResponse(res.body);
      expect(body.content).toBe("Updated content");
    });

    it("should set isEdited to true on update", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "Original",
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Edited",
        });

      expect(res.status).toBe(200);
      const body = asNoteResponse(res.body);
      expect(body.isEdited).toBe(true);
    });

    it("should set updatedBy on update", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "Original",
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Edited",
        });

      expect(res.status).toBe(200);
      const body = asNoteResponse(res.body);
      expect(body.updatedBy).not.toBeNull();
      expect(body.updatedBy!.id).toBe(testUser.id);
    });

    it("should return unchanged note when no fields provided", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
        content: "Original content",
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(200);
      const body = asNoteResponse(res.body);
      expect(body.content).toBe("Original content");
      expect(body.isEdited).toBe(false);
    });

    it("should return 400 for terminal claim status", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
      });

      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "SETTLED" },
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Should fail",
        });

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent note", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}/notes/nonexistent-note-id`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Should fail",
        });

      expect(res.status).toBe(404);
    });

    it("should return 404 when note belongs to different claim", async () => {
      const otherClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testAffiliate.id,
        createdById: testUser.id,
      });

      const note = await createTestNote({
        entityId: otherClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Should fail",
        });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // DELETE /claims/:claimId/notes/:noteId - Delete Note
  // ===========================================================================

  describe("DELETE /claims/:claimId/notes/:noteId - Delete Note", () => {
    it("should soft delete note and return 204", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const deleted = await db.note.findUnique({
        where: { id: note.id },
      });
      expect(deleted).not.toBeNull();
      expect(deleted!.deletedAt).not.toBeNull();
    });

    it("should set deletedById on soft delete", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const deleted = await db.note.findUnique({
        where: { id: note.id },
      });
      expect(deleted!.deletedById).toBe(testUser.id);
    });

    it("should not appear in list after deletion", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
      });

      await request(app)
        .delete(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      const res = await request(app)
        .get(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toHaveLength(0);
    });

    it("should return 400 for terminal claim status", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
      });

      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "CANCELLED" },
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent note", async () => {
      const res = await request(app)
        .delete(`/claims/${testClaim.id}/notes/nonexistent-note-id`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 when note belongs to different claim", async () => {
      const otherClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testAffiliate.id,
        createdById: testUser.id,
      });

      const note = await createTestNote({
        entityId: otherClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 403 without claims:edit permission", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
      });

      const { token } = await setupReadUser();

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // Audit Logging
  // ===========================================================================

  describe("Audit logging", () => {
    it("should create audit log on note creation", async () => {
      await db.auditLog.deleteMany();

      const res = await request(app)
        .post(`/claims/${testClaim.id}/notes`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Audit test note",
        });

      expect(res.status).toBe(201);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "CREATE",
          resource: "Note",
          resourceId: asNoteResponse(res.body).id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });

    it("should create audit log on note update", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
      });

      await db.auditLog.deleteMany();

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          content: "Updated for audit",
        });

      expect(res.status).toBe(200);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "Note",
          resourceId: note.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });

    it("should create audit log on note deletion", async () => {
      const note = await createTestNote({
        entityId: testClaim.id,
        createdById: testUser.id,
      });

      await db.auditLog.deleteMany();

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/notes/${note.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "DELETE",
          resource: "Note",
          resourceId: note.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });
  });
});
