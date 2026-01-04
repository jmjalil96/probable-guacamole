import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { SidebarContent } from "./sidebar-content";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Mobile drawer: Escape key, focus trap, focus restore
  useEffect(() => {
    if (!mobileOpen) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus first focusable element in drawer
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = drawer.querySelectorAll<HTMLElement>(focusableSelector);
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape") {
        onMobileClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab") {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus(); // Restore focus on close
    };
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Desktop sidebar - respects collapsed state */}
      <div className="hidden lg:block">
        <SidebarContent
          isCollapsed={collapsed}
          onMobileClose={onMobileClose}
          onCollapse={onCollapse}
        />
      </div>

      {/* Mobile drawer - always expanded */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            ref={drawerRef}
            className="relative h-full w-[260px] animate-in slide-in-from-left duration-300"
          >
            <SidebarContent
              isCollapsed={false}
              onMobileClose={onMobileClose}
              onCollapse={onCollapse}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close menu"
              className="absolute right-2 top-2 rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
