import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
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
  createTestClaimFile,
  resetClaimNumberCounter,
  SESSION_COOKIE_NAME,
} from "../../__tests__/fixtures.js";

// =============================================================================
// Mock R2 Module
// =============================================================================

vi.mock("../../../../services/storage/r2.js", () => ({
  presignPutUrl: vi.fn().mockResolvedValue("https://mock-upload-url.com/upload"),
  presignGetUrl: vi.fn().mockResolvedValue("https://mock-download-url.com/download"),
  headObject: vi.fn().mockResolvedValue({
    contentLength: 1024,
    contentType: "application/pdf",
  }),
  copyObject: vi.fn().mockResolvedValue(undefined),
  deleteObject: vi.fn().mockResolvedValue(undefined),
  r2Client: {},
}));

import * as r2 from "../../../../services/storage/r2.js";

// =============================================================================
// Response Type Helpers
// =============================================================================

interface ClaimFileResponse {
  id: string;
  claimId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  category: string | null;
  status: string;
  createdBy: { id: string; name: string };
  createdAt: string;
}

interface ListClaimFilesResponse {
  data: ClaimFileResponse[];
}

interface UploadClaimFileResponse {
  fileId: string;
  uploadUrl: string;
  expiresAt: string;
}

interface DownloadClaimFileResponse {
  downloadUrl: string;
  expiresAt: string;
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    requestId?: string;
  };
}

const asFileResponse = (body: unknown): ClaimFileResponse =>
  body as ClaimFileResponse;

const asListResponse = (body: unknown): ListClaimFilesResponse =>
  body as ListClaimFilesResponse;

const asUploadResponse = (body: unknown): UploadClaimFileResponse =>
  body as UploadClaimFileResponse;

const asDownloadResponse = (body: unknown): DownloadClaimFileResponse =>
  body as DownloadClaimFileResponse;

const asErrorResponse = (body: unknown): ErrorResponse =>
  body as ErrorResponse;

// =============================================================================
// Tests
// =============================================================================

describe("Claim Files API", () => {
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

    // Reset mocks
    vi.mocked(r2.headObject).mockResolvedValue({
      contentLength: 1024,
      contentType: "application/pdf",
    });

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
  // GET /claims/:claimId/files - List Files
  // ===========================================================================

  describe("GET /claims/:claimId/files - List Files", () => {
    it("should return empty array when no files exist", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/files`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toHaveLength(0);
    });

    it("should return all files for a claim", async () => {
      await createTestClaimFile({ claimId: testClaim.id, createdById: testUser.id });
      await createTestClaimFile({ claimId: testClaim.id, createdById: testUser.id });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/files`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toHaveLength(2);
    });

    it("should return files ordered by createdAt desc", async () => {
      const first = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        fileName: "first.pdf",
      });

      await new Promise((r) => setTimeout(r, 10));

      const second = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        fileName: "second.pdf",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/files`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data[0]!.id).toBe(second.id);
      expect(body.data[1]!.id).toBe(first.id);
    });

    it("should not return soft-deleted files", async () => {
      await createTestClaimFile({ claimId: testClaim.id, createdById: testUser.id });
      const deletedFile = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      await db.file.update({
        where: { id: deletedFile.id },
        data: { deletedAt: new Date() },
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/files`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toHaveLength(1);
    });

    it("should return 404 for non-existent claim", async () => {
      const res = await request(app)
        .get("/claims/nonexistent-claim-id/files")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 401 without auth", async () => {
      const res = await request(app).get(`/claims/${testClaim.id}/files`);

      expect(res.status).toBe(401);
    });

    it("should return 403 without claims:read permission", async () => {
      const role = await seedRoleWithoutPermission("UNLIMITED");
      const user = await createTestUser(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get(`/claims/${testClaim.id}/files`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
    });

    it("should return 403 without UNLIMITED scope", async () => {
      const role = await seedRoleWithClaimsPermission("CLIENT");
      const user = await createTestUser(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get(`/claims/${testClaim.id}/files`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // POST /claims/:claimId/files/upload - Upload File
  // ===========================================================================

  describe("POST /claims/:claimId/files/upload - Upload File", () => {
    it("should create file and return 201 with upload URL", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/upload`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          fileName: "test-document.pdf",
          contentType: "application/pdf",
          fileSize: 1024,
        });

      expect(res.status).toBe(201);
      const body = asUploadResponse(res.body);
      expect(body.fileId).toBeDefined();
      expect(body.uploadUrl).toBe("https://mock-upload-url.com/upload");
      expect(body.expiresAt).toBeDefined();
    });

    it("should store file in database with PENDING status", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/upload`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          fileName: "test-document.pdf",
          contentType: "application/pdf",
          fileSize: 2048,
          category: "invoice",
        });

      expect(res.status).toBe(201);

      const file = await db.file.findUnique({
        where: { id: asUploadResponse(res.body).fileId },
      });
      expect(file).not.toBeNull();
      expect(file!.status).toBe("PENDING");
      expect(file!.fileName).toContain("test-document");
      expect(file!.fileSize).toBe(2048);
      expect(file!.category).toBe("invoice");
      expect(file!.entityType).toBe("Claim");
      expect(file!.entityId).toBe(testClaim.id);
    });

    it("should return 400 for claim in SETTLED status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "SETTLED" },
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/upload`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          fileName: "test.pdf",
          contentType: "application/pdf",
          fileSize: 1024,
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
        .post(`/claims/${testClaim.id}/files/upload`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          fileName: "test.pdf",
          contentType: "application/pdf",
          fileSize: 1024,
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
        .post(`/claims/${testClaim.id}/files/upload`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          fileName: "test.pdf",
          contentType: "application/pdf",
          fileSize: 1024,
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("RETURNED");
    });

    it("should allow upload for claim in IN_REVIEW status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "IN_REVIEW" },
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/upload`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          fileName: "test.pdf",
          contentType: "application/pdf",
          fileSize: 1024,
        });

      expect(res.status).toBe(201);
    });

    it("should return 400 for invalid content type", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/upload`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          fileName: "test.exe",
          contentType: "application/x-msdownload",
          fileSize: 1024,
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.code).toBe("INVALID_CONTENT_TYPE");
    });

    it("should return 400 for file too large", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/upload`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          fileName: "large-file.pdf",
          contentType: "application/pdf",
          fileSize: 15 * 1024 * 1024, // 15MB
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.code).toBe("FILE_TOO_LARGE");
    });

    it("should return 404 for non-existent claim", async () => {
      const res = await request(app)
        .post("/claims/nonexistent-claim-id/files/upload")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          fileName: "test.pdf",
          contentType: "application/pdf",
          fileSize: 1024,
        });

      expect(res.status).toBe(404);
    });

    it("should return 400 for missing required fields", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/upload`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          fileName: "test.pdf",
        });

      expect(res.status).toBe(400);
    });

    it("should return 401 without auth", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/upload`)
        .send({
          fileName: "test.pdf",
          contentType: "application/pdf",
          fileSize: 1024,
        });

      expect(res.status).toBe(401);
    });

    it("should return 403 without claims:edit permission", async () => {
      const { token } = await setupReadUser();

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/upload`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`)
        .send({
          fileName: "test.pdf",
          contentType: "application/pdf",
          fileSize: 1024,
        });

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // POST /claims/:claimId/files/:fileId/confirm - Confirm Upload
  // ===========================================================================

  describe("POST /claims/:claimId/files/:fileId/confirm - Confirm Upload", () => {
    it("should confirm file and return 200", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "PENDING",
        fileSize: 1024,
        contentType: "application/pdf",
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/${file.id}/confirm`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asFileResponse(res.body);
      expect(body.id).toBe(file.id);
      expect(body.status).toBe("READY");
    });

    it("should update file status to READY in database", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "PENDING",
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/${file.id}/confirm`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);

      const updatedFile = await db.file.findUnique({
        where: { id: file.id },
      });
      expect(updatedFile!.status).toBe("READY");
      expect(updatedFile!.processedAt).not.toBeNull();
    });

    it("should return 400 if file not uploaded to R2 yet", async () => {
      vi.mocked(r2.headObject).mockResolvedValueOnce(null);

      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "PENDING",
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/${file.id}/confirm`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.code).toBe("FILE_NOT_UPLOADED");
    });

    it("should return 400 for file size mismatch", async () => {
      vi.mocked(r2.headObject).mockResolvedValueOnce({
        contentLength: 9999,
        contentType: "application/pdf",
      });

      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "PENDING",
        fileSize: 1024,
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/${file.id}/confirm`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.code).toBe("FILE_SIZE_MISMATCH");
    });

    it("should return file if already confirmed (idempotent)", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "READY",
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/${file.id}/confirm`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asFileResponse(res.body).status).toBe("READY");
    });

    it("should return 400 for terminal claim status", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "PENDING",
      });

      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "SETTLED" },
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/${file.id}/confirm`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent file", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/nonexistent-file-id/confirm`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 when file belongs to different claim", async () => {
      const otherClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testAffiliate.id,
        createdById: testUser.id,
      });

      const file = await createTestClaimFile({
        claimId: otherClaim.id,
        createdById: testUser.id,
        status: "PENDING",
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/${file.id}/confirm`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // GET /claims/:claimId/files/:fileId/download - Download File
  // ===========================================================================

  describe("GET /claims/:claimId/files/:fileId/download - Download File", () => {
    it("should return download URL", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "READY",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/files/${file.id}/download`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asDownloadResponse(res.body);
      expect(body.downloadUrl).toBe("https://mock-download-url.com/download");
      expect(body.expiresAt).toBeDefined();
    });

    it("should return 400 for file not in READY status", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "PENDING",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/files/${file.id}/download`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.code).toBe("FILE_NOT_READY");
    });

    it("should return 404 for non-existent file", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/files/nonexistent-file-id/download`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 when file belongs to different claim", async () => {
      const otherClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testAffiliate.id,
        createdById: testUser.id,
      });

      const file = await createTestClaimFile({
        claimId: otherClaim.id,
        createdById: testUser.id,
        status: "READY",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/files/${file.id}/download`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for soft-deleted file", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "READY",
      });

      await db.file.update({
        where: { id: file.id },
        data: { deletedAt: new Date() },
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/files/${file.id}/download`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent claim", async () => {
      const res = await request(app)
        .get("/claims/nonexistent-claim-id/files/some-file-id/download")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 401 without auth", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "READY",
      });

      const res = await request(app).get(
        `/claims/${testClaim.id}/files/${file.id}/download`
      );

      expect(res.status).toBe(401);
    });

    it("should return 403 without claims:read permission", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "READY",
      });

      const role = await seedRoleWithoutPermission("UNLIMITED");
      const user = await createTestUser(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get(`/claims/${testClaim.id}/files/${file.id}/download`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // DELETE /claims/:claimId/files/:fileId - Delete File
  // ===========================================================================

  describe("DELETE /claims/:claimId/files/:fileId - Delete File", () => {
    it("should delete file and return 204", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/files/${file.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const deletedFile = await db.file.findUnique({
        where: { id: file.id },
      });
      expect(deletedFile!.deletedAt).not.toBeNull();
    });

    it("should soft delete file (not hard delete)", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/files/${file.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const deletedFile = await db.file.findUnique({
        where: { id: file.id },
      });
      expect(deletedFile).not.toBeNull();
      expect(deletedFile!.deletedAt).toBeDefined();
    });

    it("should return 400 for terminal claim status", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "CANCELLED" },
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/files/${file.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent file", async () => {
      const res = await request(app)
        .delete(`/claims/${testClaim.id}/files/nonexistent-file-id`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 when file belongs to different claim", async () => {
      const otherClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testAffiliate.id,
        createdById: testUser.id,
      });

      const file = await createTestClaimFile({
        claimId: otherClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/files/${file.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for already deleted file", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      await db.file.update({
        where: { id: file.id },
        data: { deletedAt: new Date() },
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/files/${file.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 403 without claims:edit permission", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      const { token } = await setupReadUser();

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/files/${file.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
    });

    it("should return 401 without auth", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app).delete(
        `/claims/${testClaim.id}/files/${file.id}`
      );

      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // Audit Logging
  // ===========================================================================

  describe("Audit logging", () => {
    it("should create audit log on file upload", async () => {
      await db.auditLog.deleteMany();

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/upload`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          fileName: "test.pdf",
          contentType: "application/pdf",
          fileSize: 1024,
        });

      expect(res.status).toBe(201);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "FILE_UPLOAD_INITIATED",
          resource: "ClaimFile",
          resourceId: asUploadResponse(res.body).fileId,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });

    it("should create audit log on file confirm", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "PENDING",
      });

      await db.auditLog.deleteMany();

      const res = await request(app)
        .post(`/claims/${testClaim.id}/files/${file.id}/confirm`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "ClaimFile",
          resourceId: file.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });

    it("should create audit log on file download", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
        status: "READY",
      });

      await db.auditLog.deleteMany();

      const res = await request(app)
        .get(`/claims/${testClaim.id}/files/${file.id}/download`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "READ",
          resource: "ClaimFile",
          resourceId: file.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });

    it("should create audit log on file deletion", async () => {
      const file = await createTestClaimFile({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      await db.auditLog.deleteMany();

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/files/${file.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "DELETE",
          resource: "ClaimFile",
          resourceId: file.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });
  });
});
