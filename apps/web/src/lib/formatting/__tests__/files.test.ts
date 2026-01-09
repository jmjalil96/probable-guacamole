import { describe, it, expect } from "vitest";
import { formatFileSize, getFileIconType } from "../files";

describe("formatFileSize", () => {
  describe("bytes", () => {
    it("formats small file sizes in bytes", () => {
      expect(formatFileSize(0)).toBe("0 B");
      expect(formatFileSize(1)).toBe("1 B");
      expect(formatFileSize(500)).toBe("500 B");
      expect(formatFileSize(1023)).toBe("1023 B");
    });
  });

  describe("kilobytes", () => {
    it("formats file sizes in KB", () => {
      expect(formatFileSize(1024)).toBe("1.0 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(10240)).toBe("10.0 KB");
      expect(formatFileSize(1024 * 1024 - 1)).toBe("1024.0 KB");
    });
  });

  describe("megabytes", () => {
    it("formats file sizes in MB", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
      expect(formatFileSize(1024 * 1024 * 5)).toBe("5.0 MB");
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.5 MB");
      expect(formatFileSize(1024 * 1024 * 100)).toBe("100.0 MB");
    });
  });
});

describe("getFileIconType", () => {
  describe("image files", () => {
    it("identifies image content types", () => {
      expect(getFileIconType("image/jpeg")).toBe("image");
      expect(getFileIconType("image/png")).toBe("image");
      expect(getFileIconType("image/gif")).toBe("image");
      expect(getFileIconType("image/webp")).toBe("image");
      expect(getFileIconType("image/svg+xml")).toBe("image");
    });
  });

  describe("spreadsheet files", () => {
    it("identifies spreadsheet content types", () => {
      expect(getFileIconType("application/vnd.ms-excel")).toBe("spreadsheet");
      expect(
        getFileIconType(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
      ).toBe("spreadsheet");
      expect(getFileIconType("text/csv")).toBe("spreadsheet");
    });
  });

  describe("document files", () => {
    it("identifies PDF files", () => {
      expect(getFileIconType("application/pdf")).toBe("document");
    });

    it("identifies Word documents", () => {
      expect(getFileIconType("application/msword")).toBe("document");
      expect(
        getFileIconType(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      ).toBe("document");
    });
  });

  describe("generic files", () => {
    it("returns 'file' for unknown types", () => {
      expect(getFileIconType("application/zip")).toBe("file");
      expect(getFileIconType("text/plain")).toBe("file");
      expect(getFileIconType("application/json")).toBe("file");
      expect(getFileIconType("unknown/type")).toBe("file");
    });
  });
});
