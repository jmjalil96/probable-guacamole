import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button", () => {
  describe("rendering", () => {
    it("renders children", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button")).toHaveTextContent("Click me");
    });

    it("defaults to type button", () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("can be type submit", () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });
  });

  describe("variants", () => {
    it("applies primary variant by default", () => {
      render(<Button>Primary</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-primary");
    });

    it("applies secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-white");
    });

    it("applies destructive variant", () => {
      render(<Button variant="destructive">Delete</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-alert");
    });

    it("applies ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole("button")).toHaveClass("hover:bg-gray-100");
    });

    it("applies link variant", () => {
      render(<Button variant="link">Link</Button>);
      expect(screen.getByRole("button")).toHaveClass("text-primary");
    });
  });

  describe("sizes", () => {
    it("applies medium size by default", () => {
      render(<Button>Medium</Button>);
      expect(screen.getByRole("button")).toHaveClass("h-11");
    });

    it("applies small size", () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole("button")).toHaveClass("h-9");
    });

    it("applies large size", () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole("button")).toHaveClass("h-12");
    });

    it("applies icon size", () => {
      render(<Button size="icon">+</Button>);
      expect(screen.getByRole("button")).toHaveClass("h-11", "w-11");
    });
  });

  describe("loading state", () => {
    it("shows spinner when loading", () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("is disabled when loading", () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("sets aria-busy when loading", () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    });

    it("does not show spinner when not loading", () => {
      render(<Button>Not Loading</Button>);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("can be disabled", () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("applies disabled styles", () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button")).toHaveClass("disabled:opacity-50");
    });
  });

  describe("interactions", () => {
    it("calls onClick when clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);

      await user.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button onClick={onClick} disabled>
          Click
        </Button>
      );

      await user.click(screen.getByRole("button"));

      expect(onClick).not.toHaveBeenCalled();
    });

    it("does not call onClick when loading", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button onClick={onClick} loading>
          Click
        </Button>
      );

      await user.click(screen.getByRole("button"));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("custom className", () => {
    it("accepts custom className", () => {
      render(<Button className="custom-class">Button</Button>);
      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });

    it("merges custom className with default classes", () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("bg-primary"); // default variant class
    });
  });
});
