import {
  forwardRef,
  createContext,
  useContext,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface DropdownMenuProps {
  /** The menu content. */
  children: ReactNode;
}

export interface DropdownMenuTriggerProps {
  /** Use the child as the trigger element. */
  asChild?: boolean | undefined;
  /** The trigger content. */
  children: ReactNode;
  /** Additional class names. */
  className?: string | undefined;
  /** Whether the trigger is disabled. */
  disabled?: boolean | undefined;
}

export interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Alignment relative to trigger. @default "end" */
  align?: "start" | "end";
  /** The menu items. */
  children: ReactNode;
}

export interface DropdownMenuItemProps extends Omit<
  HTMLAttributes<HTMLButtonElement>,
  "onClick"
> {
  /** Click handler. */
  onClick?: (() => void) | undefined;
  /** Whether this is a destructive action. */
  destructive?: boolean | undefined;
  /** Whether this item is disabled. */
  disabled?: boolean | undefined;
  /** The item content. */
  children: ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {}

// =============================================================================
// Context
// =============================================================================

interface DropdownMenuContextValue {
  close: () => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(
  null
);

// =============================================================================
// Root Component
// =============================================================================

/**
 * A dropdown menu component built on Headless UI Menu.
 *
 * @example
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenu.Trigger asChild>
 *     <Button variant="secondary">More</Button>
 *   </DropdownMenu.Trigger>
 *   <DropdownMenu.Content align="end">
 *     <DropdownMenu.Item onClick={handleEdit}>Edit</DropdownMenu.Item>
 *     <DropdownMenu.Item onClick={handleDuplicate}>Duplicate</DropdownMenu.Item>
 *     <DropdownMenu.Separator />
 *     <DropdownMenu.Item destructive onClick={handleDelete}>Delete</DropdownMenu.Item>
 *   </DropdownMenu.Content>
 * </DropdownMenu>
 * ```
 */
function DropdownMenuRoot({ children }: DropdownMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ close }) => (
        <DropdownMenuContext.Provider value={{ close }}>
          {children}
        </DropdownMenuContext.Provider>
      )}
    </Menu>
  );
}

// =============================================================================
// Trigger Component
// =============================================================================

/**
 * The button that toggles the dropdown menu.
 */
const Trigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild, children, className, disabled }, ref) => {
    if (asChild) {
      // When asChild, we render the MenuButton but let it wrap the child
      return <MenuButton as="div">{children}</MenuButton>;
    }

    return (
      <MenuButton
        ref={ref}
        disabled={disabled ?? false}
        className={cn(
          "inline-flex items-center justify-center",
          "rounded-lg transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          className
        )}
      >
        {children}
      </MenuButton>
    );
  }
);
Trigger.displayName = "DropdownMenu.Trigger";

// =============================================================================
// Content Component
// =============================================================================

/**
 * The container for dropdown menu items.
 */
const Content = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ align = "end", children, className, ...props }, ref) => {
    return (
      <MenuItems
        ref={ref}
        transition
        anchor={align === "end" ? "bottom end" : "bottom start"}
        className={cn(
          "z-50 min-w-[180px] origin-top-right",
          "rounded-xl border border-border bg-background p-1 shadow-lg",
          "focus:outline-none",
          "transition duration-100 ease-out",
          "data-[closed]:scale-95 data-[closed]:opacity-0",
          className
        )}
        {...props}
      >
        {children}
      </MenuItems>
    );
  }
);
Content.displayName = "DropdownMenu.Content";

// =============================================================================
// Item Component
// =============================================================================

/**
 * A single menu item.
 */
const Item = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ onClick, destructive, disabled, children, className, ...props }, ref) => {
    const context = useContext(DropdownMenuContext);

    const handleClick = () => {
      onClick?.();
      context?.close();
    };

    return (
      <MenuItem>
        {({ focus }) => (
          <button
            ref={ref}
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2",
              "text-left text-sm",
              "transition-colors",
              "disabled:pointer-events-none disabled:opacity-50",
              destructive
                ? cn("text-alert", focus && "bg-alert/10")
                : cn("text-text", focus && "bg-primary/10 text-primary"),
              className
            )}
            {...props}
          >
            {children}
          </button>
        )}
      </MenuItem>
    );
  }
);
Item.displayName = "DropdownMenu.Item";

// =============================================================================
// Separator Component
// =============================================================================

/**
 * A visual separator between menu items.
 */
const Separator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("my-1 h-px bg-border", className)}
        role="separator"
        {...props}
      />
    );
  }
);
Separator.displayName = "DropdownMenu.Separator";

// =============================================================================
// Compound Export
// =============================================================================

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger,
  Content,
  Item,
  Separator,
});
