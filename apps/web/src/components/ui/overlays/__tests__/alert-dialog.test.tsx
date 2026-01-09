import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertDialog } from "../alert-dialog";

describe("AlertDialog", () => {
  describe("rendering", () => {
    it("renders when open", () => {
      render(
        <AlertDialog open={true} onClose={vi.fn()}>
          <AlertDialog.Panel>
            <AlertDialog.Title>Confirm Action</AlertDialog.Title>
            <AlertDialog.Description>
              Are you sure you want to proceed?
            </AlertDialog.Description>
          </AlertDialog.Panel>
        </AlertDialog>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Confirm Action")).toBeInTheDocument();
      expect(
        screen.getByText("Are you sure you want to proceed?")
      ).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(
        <AlertDialog open={false} onClose={vi.fn()}>
          <AlertDialog.Panel>
            <AlertDialog.Title>Title</AlertDialog.Title>
          </AlertDialog.Panel>
        </AlertDialog>
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("icon variants", () => {
    it("renders info variant", () => {
      render(
        <AlertDialog open={true} onClose={vi.fn()}>
          <AlertDialog.Panel>
            <AlertDialog.Icon variant="info" data-testid="icon" />
            <AlertDialog.Title>Info</AlertDialog.Title>
          </AlertDialog.Panel>
        </AlertDialog>
      );

      const icon = screen.getByTestId("icon");
      expect(icon).toHaveClass("bg-blue-50");
    });

    it("renders warning variant", () => {
      render(
        <AlertDialog open={true} onClose={vi.fn()}>
          <AlertDialog.Panel>
            <AlertDialog.Icon variant="warning" data-testid="icon" />
            <AlertDialog.Title>Warning</AlertDialog.Title>
          </AlertDialog.Panel>
        </AlertDialog>
      );

      const icon = screen.getByTestId("icon");
      expect(icon).toHaveClass("bg-amber-50");
    });

    it("renders danger variant", () => {
      render(
        <AlertDialog open={true} onClose={vi.fn()}>
          <AlertDialog.Panel>
            <AlertDialog.Icon variant="danger" data-testid="icon" />
            <AlertDialog.Title>Danger</AlertDialog.Title>
          </AlertDialog.Panel>
        </AlertDialog>
      );

      const icon = screen.getByTestId("icon");
      expect(icon).toHaveClass("bg-red-50");
    });

    it("defaults to warning variant", () => {
      render(
        <AlertDialog open={true} onClose={vi.fn()}>
          <AlertDialog.Panel>
            <AlertDialog.Icon data-testid="icon" />
            <AlertDialog.Title>Default</AlertDialog.Title>
          </AlertDialog.Panel>
        </AlertDialog>
      );

      const icon = screen.getByTestId("icon");
      expect(icon).toHaveClass("bg-amber-50");
    });
  });

  describe("close behavior", () => {
    it("calls onClose when escape key is pressed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <AlertDialog open={true} onClose={onClose}>
          <AlertDialog.Panel>
            <AlertDialog.Title>Title</AlertDialog.Title>
          </AlertDialog.Panel>
        </AlertDialog>
      );

      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("actions", () => {
    it("renders action buttons", () => {
      render(
        <AlertDialog open={true} onClose={vi.fn()}>
          <AlertDialog.Panel>
            <AlertDialog.Title>Confirm</AlertDialog.Title>
            <AlertDialog.Actions>
              <button>Cancel</button>
              <button>Confirm</button>
            </AlertDialog.Actions>
          </AlertDialog.Panel>
        </AlertDialog>
      );

      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Confirm" })
      ).toBeInTheDocument();
    });

    it("can handle button clicks", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <AlertDialog open={true} onClose={vi.fn()}>
          <AlertDialog.Panel>
            <AlertDialog.Title>Confirm</AlertDialog.Title>
            <AlertDialog.Actions>
              <button onClick={onCancel}>Cancel</button>
              <button onClick={onConfirm}>Confirm</button>
            </AlertDialog.Actions>
          </AlertDialog.Panel>
        </AlertDialog>
      );

      await user.click(screen.getByRole("button", { name: "Confirm" }));
      expect(onConfirm).toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has accessible dialog role", () => {
      render(
        <AlertDialog open={true} onClose={vi.fn()}>
          <AlertDialog.Panel>
            <AlertDialog.Title>Accessible Title</AlertDialog.Title>
          </AlertDialog.Panel>
        </AlertDialog>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
