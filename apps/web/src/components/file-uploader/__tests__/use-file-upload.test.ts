import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFileUpload } from "../use-file-upload";
import type { UploadAdapter } from "../types";

// Mock XMLHttpRequest
class MockXHR {
  static instances: MockXHR[] = [];

  status = 200;
  upload = {
    addEventListener: vi.fn(
      (event: string, handler: (e: ProgressEvent) => void) => {
        if (event === "progress") {
          (this as MockXHR).progressHandler = handler;
        }
      }
    ),
  };
  progressHandler?: (e: ProgressEvent) => void;
  loadHandler?: () => void;
  errorHandler?: () => void;
  abortHandler?: () => void;

  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn(() => {
    // Simulate successful upload after a small delay
    setTimeout(() => {
      if (this.loadHandler) {
        this.loadHandler();
      }
    }, 0);
  });
  abort = vi.fn(() => {
    if (this.abortHandler) {
      this.abortHandler();
    }
  });

  addEventListener = vi.fn((event: string, handler: () => void) => {
    if (event === "load") this.loadHandler = handler;
    if (event === "error") this.errorHandler = handler;
    if (event === "abort") this.abortHandler = handler;
  });

  constructor() {
    MockXHR.instances.push(this);
  }

  static clear() {
    MockXHR.instances = [];
  }
}

// Create mock adapter
function createMockAdapter(): UploadAdapter<string, { id: string }> {
  return {
    getUploadUrl: vi.fn().mockResolvedValue({
      uploadUrl: "https://s3.example.com/upload",
      result: { id: "upload-123" },
    }),
    getSubmitValue: vi.fn((result: { id: string }) => result.id),
  };
}

// Create a mock File
function createMockFile(name = "test.pdf", type = "application/pdf"): File {
  return new File(["test content"], name, { type });
}

describe("useFileUpload", () => {
  let originalXHR: typeof XMLHttpRequest;

  beforeEach(() => {
    MockXHR.clear();
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
    originalXHR = (globalThis as any).XMLHttpRequest;
    (globalThis as any).XMLHttpRequest = vi.fn(() => new MockXHR());
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
  });

  afterEach(() => {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
    (globalThis as any).XMLHttpRequest = originalXHR;
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
  });

  describe("initial state", () => {
    it("starts with empty files array", () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() => useFileUpload({ adapter }));

      expect(result.current.files).toEqual([]);
    });

    it("starts with no selected category", () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() => useFileUpload({ adapter }));

      expect(result.current.selectedCategory).toBeNull();
    });

    it("starts with correct flags", () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() => useFileUpload({ adapter }));

      expect(result.current.isUploading).toBe(false);
      expect(result.current.hasErrors).toBe(false);
      expect(result.current.canAddMore).toBe(true);
      expect(result.current.allCompleted).toBe(false);
    });

    it("uses default maxFiles of 20", () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() => useFileUpload({ adapter }));

      expect(result.current.maxFiles).toBe(20);
    });

    it("respects custom maxFiles", () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() =>
        useFileUpload({ adapter, maxFiles: 5 })
      );

      expect(result.current.maxFiles).toBe(5);
    });
  });

  describe("category selection", () => {
    it("can select a category", () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() => useFileUpload({ adapter }));

      act(() => {
        result.current.setSelectedCategory("documents");
      });

      expect(result.current.selectedCategory).toBe("documents");
    });

    it("can clear category selection", () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() => useFileUpload({ adapter }));

      act(() => {
        result.current.setSelectedCategory("documents");
      });
      act(() => {
        result.current.setSelectedCategory(null);
      });

      expect(result.current.selectedCategory).toBeNull();
    });
  });

  describe("adding files", () => {
    it("requires category to be selected before adding files", () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() => useFileUpload({ adapter }));

      const file = createMockFile();

      act(() => {
        result.current.addFiles([file]);
      });

      // Files should not be added without category
      expect(result.current.files).toEqual([]);
    });

    it("adds files when category is selected", async () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() => useFileUpload({ adapter }));

      const file = createMockFile();

      act(() => {
        result.current.setSelectedCategory("documents");
      });

      act(() => {
        result.current.addFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.files.length).toBe(1);
        expect(result.current.files[0]!.file).toBe(file);
        expect(result.current.files[0]!.category).toBe("documents");
      });
    });

    it("limits files to maxFiles", () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() =>
        useFileUpload({ adapter, maxFiles: 2 })
      );

      const files = [
        createMockFile("file1.pdf"),
        createMockFile("file2.pdf"),
        createMockFile("file3.pdf"),
      ];

      act(() => {
        result.current.setSelectedCategory("documents");
      });

      act(() => {
        result.current.addFiles(files);
      });

      expect(result.current.files.length).toBe(2);
    });
  });

  describe("removing files", () => {
    it("removes file by id", async () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() => useFileUpload({ adapter }));

      const file = createMockFile();

      act(() => {
        result.current.setSelectedCategory("documents");
      });

      act(() => {
        result.current.addFiles([file]);
      });

      await waitFor(() => {
        expect(result.current.files.length).toBe(1);
      });

      const fileId = result.current.files[0]!.id;

      act(() => {
        result.current.removeFile(fileId);
      });

      expect(result.current.files.length).toBe(0);
    });
  });

  describe("clearing files", () => {
    it("clears all files", async () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() => useFileUpload({ adapter }));

      act(() => {
        result.current.setSelectedCategory("documents");
      });

      act(() => {
        result.current.addFiles([
          createMockFile("file1.pdf"),
          createMockFile("file2.pdf"),
        ]);
      });

      await waitFor(() => {
        expect(result.current.files.length).toBe(2);
      });

      act(() => {
        result.current.clearFiles();
      });

      expect(result.current.files.length).toBe(0);
      expect(result.current.selectedCategory).toBeNull();
    });
  });

  describe("upload results", () => {
    it("getUploadResults returns empty array initially", () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() => useFileUpload({ adapter }));

      expect(result.current.getUploadResults()).toEqual([]);
    });
  });

  describe("callbacks", () => {
    it("calls onError when upload fails", async () => {
      const adapter = createMockAdapter();
      adapter.getUploadUrl = vi
        .fn()
        .mockRejectedValue(new Error("Upload failed"));

      const onError = vi.fn();
      const { result } = renderHook(() => useFileUpload({ adapter, onError }));

      act(() => {
        result.current.setSelectedCategory("documents");
      });

      act(() => {
        result.current.addFiles([createMockFile()]);
      });

      await waitFor(() => {
        expect(result.current.files[0]!.status).toBe("error");
      });

      expect(onError).toHaveBeenCalled();
    });
  });

  describe("status flags", () => {
    it("hasErrors is true when file has error", async () => {
      const adapter = createMockAdapter();
      adapter.getUploadUrl = vi
        .fn()
        .mockRejectedValue(new Error("Upload failed"));

      const { result } = renderHook(() => useFileUpload({ adapter }));

      act(() => {
        result.current.setSelectedCategory("documents");
      });

      act(() => {
        result.current.addFiles([createMockFile()]);
      });

      await waitFor(() => {
        expect(result.current.hasErrors).toBe(true);
      });
    });

    it("canAddMore is false when at maxFiles", async () => {
      const adapter = createMockAdapter();
      const { result } = renderHook(() =>
        useFileUpload({ adapter, maxFiles: 1 })
      );

      act(() => {
        result.current.setSelectedCategory("documents");
      });

      act(() => {
        result.current.addFiles([createMockFile()]);
      });

      await waitFor(() => {
        expect(result.current.canAddMore).toBe(false);
      });
    });
  });
});
