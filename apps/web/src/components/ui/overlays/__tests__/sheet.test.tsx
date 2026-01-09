import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sheet } from "../sheet";

describe("Sheet", () => {
  describe("rendering", () => {
    it("renders when open", () => {
      render(
        <Sheet open={true} onClose={vi.fn()}>
          <Sheet.Panel>
            <Sheet.Header>
              <Sheet.Title>Test Title</Sheet.Title>
            </Sheet.Header>
            <Sheet.Body>Test Body</Sheet.Body>
          </Sheet.Panel>
        </Sheet>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test Body")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(
        <Sheet open={false} onClose={vi.fn()}>
          <Sheet.Panel>
            <Sheet.Body>Content</Sheet.Body>
          </Sheet.Panel>
        </Sheet>
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("close behavior", () => {
    it("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Sheet open={true} onClose={onClose}>
          <Sheet.Panel>
            <Sheet.Header>
              <Sheet.Title>Title</Sheet.Title>
            </Sheet.Header>
          </Sheet.Panel>
        </Sheet>
      );

      await user.click(screen.getByRole("button", { name: /cerrar/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when escape key is pressed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Sheet open={true} onClose={onClose}>
          <Sheet.Panel>
            <Sheet.Body>Content</Sheet.Body>
          </Sheet.Panel>
        </Sheet>
      );

      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("compound components", () => {
    it("renders Sheet.Description", () => {
      render(
        <Sheet open={true} onClose={vi.fn()}>
          <Sheet.Panel>
            <Sheet.Header>
              <Sheet.Title>Title</Sheet.Title>
              <Sheet.Description>Description text</Sheet.Description>
            </Sheet.Header>
          </Sheet.Panel>
        </Sheet>
      );

      expect(screen.getByText("Description text")).toBeInTheDocument();
    });

    it("renders Sheet.Footer with buttons", () => {
      render(
        <Sheet open={true} onClose={vi.fn()}>
          <Sheet.Panel>
            <Sheet.Body>Content</Sheet.Body>
            <Sheet.Footer>
              <button>Cancel</button>
              <button>Save</button>
            </Sheet.Footer>
          </Sheet.Panel>
        </Sheet>
      );

      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("renders Sheet.Close button", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Sheet open={true} onClose={onClose}>
          <Sheet.Panel>
            <Sheet.Body>
              <Sheet.Close>Custom Close</Sheet.Close>
            </Sheet.Body>
          </Sheet.Panel>
        </Sheet>
      );

      await user.click(screen.getByRole("button", { name: "Custom Close" }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("sides", () => {
    it.each(["right", "left", "top", "bottom"] as const)(
      "renders with side %s",
      (side) => {
        render(
          <Sheet open={true} onClose={vi.fn()}>
            <Sheet.Panel side={side}>
              <Sheet.Body>Content</Sheet.Body>
            </Sheet.Panel>
          </Sheet>
        );

        expect(screen.getByRole("dialog")).toBeInTheDocument();
      }
    );
  });

  describe("sizes", () => {
    it.each(["sm", "md", "lg", "xl", "full"] as const)(
      "renders with size %s",
      (size) => {
        render(
          <Sheet open={true} onClose={vi.fn()}>
            <Sheet.Panel size={size}>
              <Sheet.Body>Content</Sheet.Body>
            </Sheet.Panel>
          </Sheet>
        );

        expect(screen.getByRole("dialog")).toBeInTheDocument();
      }
    );
  });

  describe("accessibility", () => {
    it("has accessible dialog role", () => {
      render(
        <Sheet open={true} onClose={vi.fn()}>
          <Sheet.Panel>
            <Sheet.Header>
              <Sheet.Title>Accessible Title</Sheet.Title>
            </Sheet.Header>
          </Sheet.Panel>
        </Sheet>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("close button has aria-label", () => {
      render(
        <Sheet open={true} onClose={vi.fn()}>
          <Sheet.Panel>
            <Sheet.Header>
              <Sheet.Title>Title</Sheet.Title>
            </Sheet.Header>
          </Sheet.Panel>
        </Sheet>
      );

      expect(
        screen.getByRole("button", { name: /cerrar/i })
      ).toBeInTheDocument();
    });
  });
});
