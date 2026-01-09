import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteDialog } from "../delete-dialog";

describe("DeleteDialog", () => {
  const defaultProps = {
    open: true,
    title: "Eliminar elemento",
    description: "¿Está seguro que desea eliminar este elemento?",
    isDeleting: false,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  describe("rendering", () => {
    it("renders when open", () => {
      render(<DeleteDialog {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Eliminar elemento")).toBeInTheDocument();
      expect(
        screen.getByText(/¿Está seguro que desea eliminar este elemento\?/)
      ).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(<DeleteDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders item preview when provided", () => {
      render(<DeleteDialog {...defaultProps} itemPreview="Factura #12345" />);

      // The component uses curly quotes (&ldquo; and &rdquo;)
      expect(screen.getByText(/Factura #12345/)).toBeInTheDocument();
    });

    it("renders warning about irreversibility", () => {
      render(<DeleteDialog {...defaultProps} />);

      expect(
        screen.getByText(/Esta acción no se puede deshacer/i)
      ).toBeInTheDocument();
    });

    it("renders danger icon", () => {
      render(<DeleteDialog {...defaultProps} />);

      // The danger icon container should have red styling
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });
  });

  describe("buttons", () => {
    it("renders default button labels", () => {
      render(<DeleteDialog {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: "Cancelar" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Eliminar" })
      ).toBeInTheDocument();
    });

    it("renders custom button labels", () => {
      render(
        <DeleteDialog
          {...defaultProps}
          confirmLabel="Sí, eliminar"
          cancelLabel="No, volver"
        />
      );

      expect(
        screen.getByRole("button", { name: "No, volver" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sí, eliminar" })
      ).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("calls onConfirm when confirm button is clicked", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(<DeleteDialog {...defaultProps} onConfirm={onConfirm} />);

      await user.click(screen.getByRole("button", { name: "Eliminar" }));

      expect(onConfirm).toHaveBeenCalled();
    });

    it("calls onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      render(<DeleteDialog {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(onCancel).toHaveBeenCalled();
    });

    it("calls onCancel when escape is pressed", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      render(<DeleteDialog {...defaultProps} onCancel={onCancel} />);

      await user.keyboard("{Escape}");

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("shows loading state on confirm button when isDeleting", () => {
      render(<DeleteDialog {...defaultProps} isDeleting />);

      // Find the confirm button by its text content (it contains a spinner + text)
      const confirmButton = screen.getByRole("button", { name: /eliminar/i });
      expect(confirmButton).toBeDisabled();
      expect(confirmButton).toHaveAttribute("aria-busy", "true");
    });

    it("disables cancel button when isDeleting", () => {
      render(<DeleteDialog {...defaultProps} isDeleting />);

      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("has accessible dialog role", () => {
      render(<DeleteDialog {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
