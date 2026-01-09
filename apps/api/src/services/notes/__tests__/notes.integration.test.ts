import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "../../../config/db.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import { AppError } from "../../../lib/errors.js";
import * as notesService from "../notes.js";
import type { AuditContext } from "../../audit/audit.js";

// =============================================================================
// Test Helpers
// =============================================================================

async function seedTestRole(scopeType: "UNLIMITED" | "CLIENT" | "SELF" = "UNLIMITED") {
  return db.role.create({
    data: {
      name: `test-role-${Date.now()}`,
      displayName: "Test Role",
      description: "Test role for notes tests",
      scopeType,
    },
  });
}

async function createTestUser(roleId: string) {
  return db.user.create({
    data: {
      email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash: "hashed-password",
      roleId,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });
}

async function createTestEmployee(userId: string) {
  return db.employee.create({
    data: {
      firstName: "Test",
      lastName: `Employee-${Date.now()}`,
      email: `employee-${Date.now()}@example.com`,
      isActive: true,
      userId,
    },
  });
}

async function createTestNote(options: {
  entityType?: string;
  entityId: string;
  createdById: string;
  content?: string;
  isInternal?: boolean;
  isEdited?: boolean;
  updatedById?: string | null;
  deletedAt?: Date | null;
  deletedById?: string | null;
}) {
  return db.note.create({
    data: {
      entityType: options.entityType ?? "Claim",
      entityId: options.entityId,
      content: options.content ?? `Test note ${Date.now()}`,
      isInternal: options.isInternal ?? false,
      isEdited: options.isEdited ?? false,
      createdById: options.createdById,
      updatedById: options.updatedById ?? null,
      deletedAt: options.deletedAt ?? null,
      deletedById: options.deletedById ?? null,
    },
  });
}

// =============================================================================
// Tests
// =============================================================================

describe("Notes Service", () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let testEntityId: string;
  let auditContext: AuditContext;

  beforeEach(async () => {
    await cleanDatabase();

    const role = await seedTestRole();
    testUser = await createTestUser(role.id);
    await createTestEmployee(testUser.id);

    testEntityId = `test-entity-${Date.now()}`;

    auditContext = {
      userId: testUser.id,
      sessionId: null,
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
      requestId: "test-request-id",
    };
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ===========================================================================
  // listNotes
  // ===========================================================================

  describe("listNotes", () => {
    it("should return empty response when no notes exist", async () => {
      const result = await notesService.listNotes({
        entityType: "Claim",
        entityId: testEntityId,
        query: { page: 1, limit: 20, sortOrder: "desc", includeInternal: false },
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should return notes for specified entity", async () => {
      await createTestNote({ entityId: testEntityId, createdById: testUser.id });
      await createTestNote({ entityId: testEntityId, createdById: testUser.id });

      const result = await notesService.listNotes({
        entityType: "Claim",
        entityId: testEntityId,
        query: { page: 1, limit: 20, sortOrder: "desc", includeInternal: false },
      });

      expect(result.data).toHaveLength(2);
    });

    it("should filter by entityType and entityId", async () => {
      await createTestNote({
        entityType: "Claim",
        entityId: testEntityId,
        createdById: testUser.id,
      });
      await createTestNote({
        entityType: "OtherEntity",
        entityId: testEntityId,
        createdById: testUser.id,
      });
      await createTestNote({
        entityType: "Claim",
        entityId: "other-id",
        createdById: testUser.id,
      });

      const result = await notesService.listNotes({
        entityType: "Claim",
        entityId: testEntityId,
        query: { page: 1, limit: 20, sortOrder: "desc", includeInternal: false },
      });

      expect(result.data).toHaveLength(1);
    });

    it("should exclude soft-deleted notes", async () => {
      await createTestNote({ entityId: testEntityId, createdById: testUser.id });
      await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        deletedAt: new Date(),
        deletedById: testUser.id,
      });

      const result = await notesService.listNotes({
        entityType: "Claim",
        entityId: testEntityId,
        query: { page: 1, limit: 20, sortOrder: "desc", includeInternal: false },
      });

      expect(result.data).toHaveLength(1);
    });

    it("should exclude internal notes by default", async () => {
      await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        isInternal: false,
      });
      await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        isInternal: true,
      });

      const result = await notesService.listNotes({
        entityType: "Claim",
        entityId: testEntityId,
        query: { page: 1, limit: 20, sortOrder: "desc", includeInternal: false },
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.isInternal).toBe(false);
    });

    it("should include internal notes when includeInternal=true", async () => {
      await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        isInternal: false,
      });
      await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        isInternal: true,
      });

      const result = await notesService.listNotes({
        entityType: "Claim",
        entityId: testEntityId,
        query: { page: 1, limit: 20, sortOrder: "desc", includeInternal: true },
      });

      expect(result.data).toHaveLength(2);
    });

    it("should paginate correctly", async () => {
      for (let i = 0; i < 5; i++) {
        await createTestNote({
          entityId: testEntityId,
          createdById: testUser.id,
          content: `Note ${i}`,
        });
      }

      const result = await notesService.listNotes({
        entityType: "Claim",
        entityId: testEntityId,
        query: { page: 2, limit: 2, sortOrder: "desc", includeInternal: false },
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.totalPages).toBe(3);
    });

    it("should sort by createdAt desc by default", async () => {
      const first = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        content: "First",
      });

      await new Promise((r) => setTimeout(r, 10));

      const second = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        content: "Second",
      });

      const result = await notesService.listNotes({
        entityType: "Claim",
        entityId: testEntityId,
        query: { page: 1, limit: 20, sortOrder: "desc", includeInternal: false },
      });

      expect(result.data[0]!.id).toBe(second.id);
      expect(result.data[1]!.id).toBe(first.id);
    });

    it("should sort by createdAt asc when specified", async () => {
      const first = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        content: "First",
      });

      await new Promise((r) => setTimeout(r, 10));

      const second = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        content: "Second",
      });

      const result = await notesService.listNotes({
        entityType: "Claim",
        entityId: testEntityId,
        query: { page: 1, limit: 20, sortOrder: "asc", includeInternal: false },
      });

      expect(result.data[0]!.id).toBe(first.id);
      expect(result.data[1]!.id).toBe(second.id);
    });
  });

  // ===========================================================================
  // getNote
  // ===========================================================================

  describe("getNote", () => {
    it("should return note with all fields mapped", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        content: "Test content",
        isInternal: true,
      });

      const result = await notesService.getNote(
        {
          noteId: note.id,
          entityType: "Claim",
          entityId: testEntityId,
        },
        auditContext
      );

      expect(result.id).toBe(note.id);
      expect(result.entityType).toBe("Claim");
      expect(result.entityId).toBe(testEntityId);
      expect(result.content).toBe("Test content");
      expect(result.isInternal).toBe(true);
      expect(result.isEdited).toBe(false);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should return createdBy user profile", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
      });

      const result = await notesService.getNote(
        {
          noteId: note.id,
          entityType: "Claim",
          entityId: testEntityId,
        },
        auditContext
      );

      expect(result.createdBy.id).toBe(testUser.id);
      expect(result.createdBy.name).toContain("Employee");
    });

    it("should return updatedBy when note was edited", async () => {
      const role = await seedTestRole();
      const otherUser = await createTestUser(role.id);
      await createTestEmployee(otherUser.id);

      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        isEdited: true,
        updatedById: otherUser.id,
      });

      const result = await notesService.getNote(
        {
          noteId: note.id,
          entityType: "Claim",
          entityId: testEntityId,
        },
        auditContext
      );

      expect(result.updatedBy).not.toBeNull();
      expect(result.updatedBy!.id).toBe(otherUser.id);
    });

    it("should throw NotFound for non-existent note", async () => {
      await expect(
        notesService.getNote(
          {
            noteId: "nonexistent-id",
            entityType: "Claim",
            entityId: testEntityId,
          },
          auditContext
        )
      ).rejects.toThrow(AppError);
    });

    it("should throw NotFound for soft-deleted note", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        deletedAt: new Date(),
        deletedById: testUser.id,
      });

      await expect(
        notesService.getNote(
          {
            noteId: note.id,
            entityType: "Claim",
            entityId: testEntityId,
          },
          auditContext
        )
      ).rejects.toThrow(AppError);
    });

    it("should create READ audit log", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
      });

      await db.auditLog.deleteMany();

      await notesService.getNote(
        {
          noteId: note.id,
          entityType: "Claim",
          entityId: testEntityId,
        },
        auditContext
      );

      await new Promise((r) => setTimeout(r, 200));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "READ",
          resource: "Note",
          resourceId: note.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });
  });

  // ===========================================================================
  // createNote
  // ===========================================================================

  describe("createNote", () => {
    it("should create note with required fields", async () => {
      const result = await notesService.createNote(
        {
          entityType: "Claim",
          entityId: testEntityId,
          content: "New note content",
          isInternal: false,
          userId: testUser.id,
        },
        auditContext
      );

      expect(result.id).toBeDefined();
      expect(result.entityType).toBe("Claim");
      expect(result.entityId).toBe(testEntityId);
      expect(result.content).toBe("New note content");
      expect(result.isInternal).toBe(false);
      expect(result.isEdited).toBe(false);
    });

    it("should create internal note", async () => {
      const result = await notesService.createNote(
        {
          entityType: "Claim",
          entityId: testEntityId,
          content: "Internal note",
          isInternal: true,
          userId: testUser.id,
        },
        auditContext
      );

      expect(result.isInternal).toBe(true);
    });

    it("should set createdById", async () => {
      const result = await notesService.createNote(
        {
          entityType: "Claim",
          entityId: testEntityId,
          content: "Test",
          isInternal: false,
          userId: testUser.id,
        },
        auditContext
      );

      expect(result.createdBy.id).toBe(testUser.id);
    });

    it("should create CREATE audit log with newValue", async () => {
      await db.auditLog.deleteMany();

      const result = await notesService.createNote(
        {
          entityType: "Claim",
          entityId: testEntityId,
          content: "Audit test",
          isInternal: true,
          userId: testUser.id,
        },
        auditContext
      );

      await new Promise((r) => setTimeout(r, 200));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "CREATE",
          resource: "Note",
          resourceId: result.id,
        },
      });

      expect(auditLog).not.toBeNull();
      const newValue = auditLog!.newValue as { content: string; isInternal: boolean };
      expect(newValue.content).toBe("Audit test");
      expect(newValue.isInternal).toBe(true);
    });
  });

  // ===========================================================================
  // updateNote
  // ===========================================================================

  describe("updateNote", () => {
    it("should update content", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        content: "Original",
      });

      const result = await notesService.updateNote(
        {
          noteId: note.id,
          content: "Updated",
          userId: testUser.id,
        },
        auditContext
      );

      expect(result.content).toBe("Updated");
    });

    it("should set isEdited to true", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
      });

      const result = await notesService.updateNote(
        {
          noteId: note.id,
          content: "Edited",
          userId: testUser.id,
        },
        auditContext
      );

      expect(result.isEdited).toBe(true);
    });

    it("should set updatedById", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
      });

      const result = await notesService.updateNote(
        {
          noteId: note.id,
          content: "Edited",
          userId: testUser.id,
        },
        auditContext
      );

      expect(result.updatedBy).not.toBeNull();
      expect(result.updatedBy!.id).toBe(testUser.id);
    });

    it("should throw NotFound for non-existent note", async () => {
      await expect(
        notesService.updateNote(
          {
            noteId: "nonexistent-id",
            content: "Test",
            userId: testUser.id,
          },
          auditContext
        )
      ).rejects.toThrow(AppError);
    });

    it("should throw NotFound for soft-deleted note", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        deletedAt: new Date(),
        deletedById: testUser.id,
      });

      await expect(
        notesService.updateNote(
          {
            noteId: note.id,
            content: "Test",
            userId: testUser.id,
          },
          auditContext
        )
      ).rejects.toThrow(AppError);
    });

    it("should create UPDATE audit log with oldValue/newValue", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        content: "Original content",
      });

      await db.auditLog.deleteMany();

      await notesService.updateNote(
        {
          noteId: note.id,
          content: "New content",
          userId: testUser.id,
        },
        auditContext
      );

      await new Promise((r) => setTimeout(r, 200));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "Note",
          resourceId: note.id,
        },
      });

      expect(auditLog).not.toBeNull();
      const oldValue = auditLog!.oldValue as { content: string };
      const newValue = auditLog!.newValue as { content: string };
      expect(oldValue.content).toBe("Original content");
      expect(newValue.content).toBe("New content");
    });
  });

  // ===========================================================================
  // deleteNote
  // ===========================================================================

  describe("deleteNote", () => {
    it("should soft delete note (sets deletedAt)", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
      });

      await notesService.deleteNote(
        {
          noteId: note.id,
          userId: testUser.id,
        },
        auditContext
      );

      const deleted = await db.note.findUnique({
        where: { id: note.id },
      });
      expect(deleted).not.toBeNull();
      expect(deleted!.deletedAt).not.toBeNull();
    });

    it("should set deletedById", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
      });

      await notesService.deleteNote(
        {
          noteId: note.id,
          userId: testUser.id,
        },
        auditContext
      );

      const deleted = await db.note.findUnique({
        where: { id: note.id },
      });
      expect(deleted!.deletedById).toBe(testUser.id);
    });

    it("should throw NotFound for non-existent note", async () => {
      await expect(
        notesService.deleteNote(
          {
            noteId: "nonexistent-id",
            userId: testUser.id,
          },
          auditContext
        )
      ).rejects.toThrow(AppError);
    });

    it("should throw NotFound for already-deleted note", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        deletedAt: new Date(),
        deletedById: testUser.id,
      });

      await expect(
        notesService.deleteNote(
          {
            noteId: note.id,
            userId: testUser.id,
          },
          auditContext
        )
      ).rejects.toThrow(AppError);
    });

    it("should create DELETE audit log with oldValue", async () => {
      const note = await createTestNote({
        entityId: testEntityId,
        createdById: testUser.id,
        content: "To be deleted",
        isInternal: true,
      });

      await db.auditLog.deleteMany();

      await notesService.deleteNote(
        {
          noteId: note.id,
          userId: testUser.id,
        },
        auditContext
      );

      await new Promise((r) => setTimeout(r, 200));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "DELETE",
          resource: "Note",
          resourceId: note.id,
        },
      });

      expect(auditLog).not.toBeNull();
      const oldValue = auditLog!.oldValue as { content: string; isInternal: boolean };
      expect(oldValue.content).toBe("To be deleted");
      expect(oldValue.isInternal).toBe(true);
    });
  });
});
