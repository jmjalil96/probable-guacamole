import { useEffect, useRef, useState } from "react";
import { useLogout } from "@/features/auth";
import { cn } from "@/lib/utils";
import type { MeResponse } from "shared";

interface UserMenuProps {
  user: MeResponse | null | undefined;
  isCollapsed: boolean;
}

function getInitials(user: MeResponse | null | undefined): string {
  if (!user?.name) return "U";
  const { firstName, lastName } = user.name;
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getUserDisplayName(user: MeResponse | null | undefined): string {
  if (!user?.name) return user?.email ?? "Usuario";
  return `${user.name.firstName} ${user.name.lastName}`;
}

function getRoleDisplay(role: string): string {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function UserMenu({ user, isCollapsed }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const logout = useLogout();

  // Close menu on click outside or Escape
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSignOut = () => {
    setOpen(false);
    logout.mutate();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={isCollapsed ? getUserDisplayName(user) : undefined}
        data-testid="user-menu"
        className={cn(
          "flex w-full items-center gap-3 rounded-xl transition-colors hover:bg-sidebar-hover",
          isCollapsed ? "justify-center p-2.5" : "p-2.5"
        )}
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-sidebar">
          {getInitials(user)}
        </div>

        {/* Info */}
        {!isCollapsed && (
          <div className="flex flex-1 flex-col text-left">
            <span className="text-sm font-medium text-sidebar-text">
              {getUserDisplayName(user)}
            </span>
            <span className="text-xs text-sidebar-muted">
              {user ? getRoleDisplay(user.role) : ""}
            </span>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 min-w-48 rounded-xl border border-border bg-background p-1 shadow-lg",
            isCollapsed ? "bottom-0 left-full ml-2" : "bottom-full left-0 mb-2"
          )}
        >
          <div className="border-b border-border px-3 py-2">
            <p className="text-sm font-medium text-text">
              {getUserDisplayName(user)}
            </p>
            <p className="text-xs text-text-muted">{user?.email}</p>
          </div>
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-border"
            >
              Configuración
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-border"
            >
              Ayuda
            </button>
          </div>
          <div className="border-t border-border pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={logout.isPending}
              data-testid="logout-button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-alert hover:bg-border disabled:opacity-50"
            >
              {logout.isPending ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
