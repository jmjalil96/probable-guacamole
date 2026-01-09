import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "../select";

const defaultOptions = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

describe("Select", () => {
  describe("rendering", () => {
    it("renders with placeholder when no value selected", () => {
      render(
        <Select
          options={defaultOptions}
          value=""
          onChange={vi.fn()}
          placeholder="Select a fruit..."
        />
      );

      expect(screen.getByText("Select a fruit...")).toBeInTheDocument();
    });

    it("renders selected option label", () => {
      render(
        <Select options={defaultOptions} value="banana" onChange={vi.fn()} />
      );

      expect(screen.getByText("Banana")).toBeInTheDocument();
    });

    it("renders with custom aria-label", () => {
      render(
        <Select
          options={defaultOptions}
          value=""
          onChange={vi.fn()}
          label="Choose fruit"
        />
      );

      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-label",
        "Choose fruit"
      );
    });
  });

  describe("disabled state", () => {
    it("disables the select when disabled prop is true", () => {
      render(
        <Select options={defaultOptions} value="" onChange={vi.fn()} disabled />
      );

      expect(screen.getByRole("combobox")).toBeDisabled();
    });
  });

  describe("selection behavior", () => {
    it("opens dropdown on click", async () => {
      const user = userEvent.setup();

      render(<Select options={defaultOptions} value="" onChange={vi.fn()} />);

      await user.click(screen.getByRole("combobox"));

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Banana" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Cherry" })
      ).toBeInTheDocument();
    });

    it("calls onChange when option is selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Select options={defaultOptions} value="" onChange={onChange} />);

      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByRole("option", { name: "Cherry" }));

      expect(onChange).toHaveBeenCalledWith("cherry");
    });
  });

  describe("sizes", () => {
    it("renders with sm size by default", () => {
      render(<Select options={defaultOptions} value="" onChange={vi.fn()} />);

      const trigger = screen.getByRole("combobox");
      // sm size uses h-10 with rounded-lg
      expect(trigger).toHaveClass("h-10");
      expect(trigger).toHaveClass("rounded-lg");
    });

    it("renders with md size", () => {
      render(
        <Select
          options={defaultOptions}
          value=""
          onChange={vi.fn()}
          size="md"
        />
      );

      const trigger = screen.getByRole("combobox");
      // md size uses h-11 with rounded-xl
      expect(trigger).toHaveClass("h-11");
      expect(trigger).toHaveClass("rounded-xl");
    });
  });

  describe("error state", () => {
    it("applies error styling when error is true", () => {
      render(
        <Select options={defaultOptions} value="" onChange={vi.fn()} error />
      );

      const trigger = screen.getByRole("combobox");
      // Error uses border-alert class
      expect(trigger).toHaveClass("border-alert");
    });
  });

  describe("accessibility", () => {
    it("has accessible combobox role", () => {
      render(<Select options={defaultOptions} value="" onChange={vi.fn()} />);

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Select options={defaultOptions} value="" onChange={onChange} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      expect(onChange).toHaveBeenCalled();
    });
  });
});
