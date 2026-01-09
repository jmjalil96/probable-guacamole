import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../input";

describe("Input", () => {
  describe("rendering", () => {
    it("renders an input element", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("defaults to type text", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
    });

    it("accepts custom type", () => {
      render(<Input type="email" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    });

    it("renders with placeholder", () => {
      render(<Input placeholder="Enter value" />);
      expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
    });

    it("renders with value", () => {
      render(<Input defaultValue="initial value" />);
      expect(screen.getByRole("textbox")).toHaveValue("initial value");
    });
  });

  describe("error state", () => {
    it("applies error styles when error is true", () => {
      render(<Input error />);
      expect(screen.getByRole("textbox")).toHaveClass("border-alert");
    });

    it("applies normal styles when error is false", () => {
      render(<Input error={false} />);
      expect(screen.getByRole("textbox")).toHaveClass("border-border");
    });
  });

  describe("disabled state", () => {
    it("can be disabled", () => {
      render(<Input disabled />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("applies disabled styles", () => {
      render(<Input disabled />);
      expect(screen.getByRole("textbox")).toHaveClass("disabled:opacity-50");
    });
  });

  describe("interactions", () => {
    it("calls onChange when typing", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Input onChange={onChange} />);

      await user.type(screen.getByRole("textbox"), "hello");

      expect(onChange).toHaveBeenCalled();
    });

    it("updates value when typing", async () => {
      const user = userEvent.setup();
      render(<Input />);

      await user.type(screen.getByRole("textbox"), "hello");

      expect(screen.getByRole("textbox")).toHaveValue("hello");
    });

    it("calls onFocus when focused", async () => {
      const user = userEvent.setup();
      const onFocus = vi.fn();
      render(<Input onFocus={onFocus} />);

      await user.click(screen.getByRole("textbox"));

      expect(onFocus).toHaveBeenCalled();
    });

    it("calls onBlur when blurred", async () => {
      const user = userEvent.setup();
      const onBlur = vi.fn();
      render(<Input onBlur={onBlur} />);

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.tab();

      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe("custom className", () => {
    it("accepts custom className", () => {
      render(<Input className="custom-class" />);
      expect(screen.getByRole("textbox")).toHaveClass("custom-class");
    });

    it("merges custom className with default classes", () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("custom-class");
      expect(input).toHaveClass("w-full"); // default class
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to input element", () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });
  });

  describe("accessibility", () => {
    it("can have aria-label", () => {
      render(<Input aria-label="Email input" />);
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-label",
        "Email input"
      );
    });

    it("can be associated with label via id", () => {
      render(
        <>
          <label htmlFor="my-input">Label</label>
          <Input id="my-input" />
        </>
      );
      expect(screen.getByLabelText("Label")).toBeInTheDocument();
    });
  });
});
