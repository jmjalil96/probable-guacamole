import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../modal";

describe("Modal", () => {
  describe("rendering", () => {
    it("renders when open", () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          <Modal.Panel>
            <Modal.Header>
              <Modal.Title>Test Title</Modal.Title>
            </Modal.Header>
            <Modal.Body>Test Body</Modal.Body>
          </Modal.Panel>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test Body")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(
        <Modal open={false} onClose={vi.fn()}>
          <Modal.Panel>
            <Modal.Body>Content</Modal.Body>
          </Modal.Panel>
        </Modal>
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("close behavior", () => {
    it("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Modal open={true} onClose={onClose}>
          <Modal.Panel>
            <Modal.Header>
              <Modal.Title>Title</Modal.Title>
            </Modal.Header>
          </Modal.Panel>
        </Modal>
      );

      await user.click(screen.getByRole("button", { name: /cerrar/i }));

      expect(onClose).toHaveBeenCalledWith(false);
    });

    it("calls onClose when escape key is pressed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Modal open={true} onClose={onClose}>
          <Modal.Panel>
            <Modal.Body>Content</Modal.Body>
          </Modal.Panel>
        </Modal>
      );

      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("compound components", () => {
    it("renders Modal.Description", () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          <Modal.Panel>
            <Modal.Header>
              <Modal.Title>Title</Modal.Title>
              <Modal.Description>Description text</Modal.Description>
            </Modal.Header>
          </Modal.Panel>
        </Modal>
      );

      expect(screen.getByText("Description text")).toBeInTheDocument();
    });

    it("renders Modal.Footer with buttons", () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          <Modal.Panel>
            <Modal.Body>Content</Modal.Body>
            <Modal.Footer>
              <button>Cancel</button>
              <button>Save</button>
            </Modal.Footer>
          </Modal.Panel>
        </Modal>
      );

      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("renders Modal.Close button", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Modal open={true} onClose={onClose}>
          <Modal.Panel>
            <Modal.Body>
              <Modal.Close>Custom Close</Modal.Close>
            </Modal.Body>
          </Modal.Panel>
        </Modal>
      );

      await user.click(screen.getByRole("button", { name: "Custom Close" }));

      expect(onClose).toHaveBeenCalledWith(false);
    });
  });

  describe("sizes", () => {
    it.each(["sm", "md", "lg", "xl", "2xl", "3xl"] as const)(
      "renders with size %s",
      (size) => {
        render(
          <Modal open={true} onClose={vi.fn()}>
            <Modal.Panel size={size}>
              <Modal.Body>Content</Modal.Body>
            </Modal.Panel>
          </Modal>
        );

        expect(screen.getByRole("dialog")).toBeInTheDocument();
      }
    );
  });

  describe("accessibility", () => {
    it("has accessible dialog role", () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          <Modal.Panel>
            <Modal.Header>
              <Modal.Title>Accessible Title</Modal.Title>
            </Modal.Header>
          </Modal.Panel>
        </Modal>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("close button has aria-label", () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          <Modal.Panel>
            <Modal.Header>
              <Modal.Title>Title</Modal.Title>
            </Modal.Header>
          </Modal.Panel>
        </Modal>
      );

      expect(
        screen.getByRole("button", { name: /cerrar/i })
      ).toBeInTheDocument();
    });
  });
});
