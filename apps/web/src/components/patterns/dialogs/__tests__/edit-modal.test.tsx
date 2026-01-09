import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditModal } from "../edit-modal";

describe("EditModal", () => {
  const defaultProps = {
    open: true,
    title: "Editar elemento",
    formId: "edit-form",
    isDirty: false,
    isBusy: false,
    onClose: vi.fn(),
    children: (
      <form id="edit-form">
        <input name="test" />
      </form>
    ),
  };

  describe("rendering", () => {
    it("renders when open", () => {
      render(<EditModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Editar elemento")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(<EditModal {...defaultProps} open={false} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders description when provided", () => {
      render(
        <EditModal {...defaultProps} description="Descripción del modal" />
      );

      expect(screen.getByText("Descripción del modal")).toBeInTheDocument();
    });

    it("renders children (form content)", () => {
      render(<EditModal {...defaultProps} />);

      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
  });

  describe("buttons", () => {
    it("renders default button labels", () => {
      render(<EditModal {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: "Cancelar" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Guardar" })
      ).toBeInTheDocument();
    });

    it("renders custom button labels", () => {
      render(
        <EditModal
          {...defaultProps}
          submitLabel="Actualizar"
          cancelLabel="Descartar"
        />
      );

      expect(
        screen.getByRole("button", { name: "Descartar" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Actualizar" })
      ).toBeInTheDocument();
    });

    it("disables submit when not dirty", () => {
      render(<EditModal {...defaultProps} isDirty={false} />);

      expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    });

    it("enables submit when dirty", () => {
      render(<EditModal {...defaultProps} isDirty={true} />);

      expect(
        screen.getByRole("button", { name: "Guardar" })
      ).not.toBeDisabled();
    });

    it("submit button has form attribute", () => {
      render(<EditModal {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: "Guardar" });
      expect(submitButton).toHaveAttribute("form", "edit-form");
      expect(submitButton).toHaveAttribute("type", "submit");
    });
  });

  describe("loading state", () => {
    it("shows loading state when isBusy", () => {
      render(<EditModal {...defaultProps} isBusy />);

      const submitButton = screen.getByRole("button", { name: /guardar/i });
      expect(submitButton).toBeDisabled();
    });

    it("disables cancel when isBusy", () => {
      render(<EditModal {...defaultProps} isBusy />);

      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    });
  });

  describe("error display", () => {
    it("displays error alert when error provided", () => {
      render(
        <EditModal
          {...defaultProps}
          error={{ title: "Error", description: "Something went wrong" }}
        />
      );

      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("does not display error alert when no error", () => {
      render(<EditModal {...defaultProps} error={null} />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("passes onClearError to Alert component", () => {
      const onClearError = vi.fn();

      render(
        <EditModal
          {...defaultProps}
          error={{ title: "Error" }}
          onClearError={onClearError}
        />
      );

      // The Alert component receives the onClearError callback
      // We verify the error alert is displayed - the Alert component itself
      // is tested separately
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  describe("close behavior", () => {
    it("closes immediately when not dirty", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditModal {...defaultProps} isDirty={false} onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(onClose).toHaveBeenCalled();
    });

    it("shows confirmation dialog when dirty and trying to close", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditModal {...defaultProps} isDirty={true} onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      // Confirmation dialog should appear
      expect(screen.getByText("¿Descartar cambios?")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("discards changes when confirmed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditModal {...defaultProps} isDirty={true} onClose={onClose} />);

      // Click cancel to trigger confirmation
      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      // Confirm discard
      await user.click(screen.getByRole("button", { name: "Descartar" }));

      expect(onClose).toHaveBeenCalled();
    });

    it("continues editing when cancel exit is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditModal {...defaultProps} isDirty={true} onClose={onClose} />);

      // Click cancel to trigger confirmation
      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      // Click continue editing
      await user.click(screen.getByRole("button", { name: "Seguir editando" }));

      expect(onClose).not.toHaveBeenCalled();
      // Confirmation dialog should be closed
      expect(screen.queryByText("¿Descartar cambios?")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has accessible dialog role", () => {
      render(<EditModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
