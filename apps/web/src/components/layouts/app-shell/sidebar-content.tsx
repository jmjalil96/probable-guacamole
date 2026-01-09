import { Link, useRouteContext } from "@tanstack/react-router";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Logo } from "@/components/ui";
import { navigation } from "@/config";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

interface SidebarContentProps {
  isCollapsed: boolean;
  onMobileClose: () => void;
  onCollapse: (collapsed: boolean) => void;
}

export function SidebarContent({
  isCollapsed,
  onMobileClose,
  onCollapse,
}: SidebarContentProps) {
  const { auth } = useRouteContext({ from: "/_authenticated" });
  const user = auth.data;

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-sidebar text-sidebar-text transition-all duration-300",
        isCollapsed ? "w-20" : "w-[260px]"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex flex-col items-center border-b border-sidebar-hover",
          isCollapsed ? "px-2 py-6" : "px-5 py-6"
        )}
      >
        <Logo
          variant="light"
          size="md"
          showTagline={!isCollapsed}
          collapsed={isCollapsed}
        />
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 space-y-1 overflow-y-auto",
          isCollapsed ? "p-2" : "p-3"
        )}
      >
        {navigation.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            aria-label={isCollapsed ? item.label : undefined}
            title={isCollapsed ? item.label : undefined}
            activeOptions={{ exact: item.to === "/" }}
            className={cn(
              "relative flex items-center gap-3.5 rounded-xl text-sidebar-text transition-colors",
              isCollapsed ? "justify-center px-0 py-3" : "px-3.5 py-3"
            )}
            activeProps={{
              className: "bg-sidebar-hover",
              "aria-current": "page",
            }}
            inactiveProps={{
              className: "hover:bg-sidebar-hover",
            }}
          >
            {({ isActive }) => (
              <>
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-accent" />
                )}

                {/* Icon */}
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </span>

                {/* Label */}
                {!isCollapsed && (
                  <span className="flex-1 text-sm font-medium">
                    {item.label}
                  </span>
                )}

                {/* Badge */}
                {item.badge !== undefined &&
                  item.badge > 0 &&
                  (isCollapsed ? (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-alert" />
                  ) : (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-alert px-1.5 text-xs font-semibold text-white">
                      {item.badge}
                    </span>
                  ))}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "border-t border-sidebar-hover",
          isCollapsed ? "p-2" : "p-3"
        )}
      >
        {/* User Menu */}
        <UserMenu user={user} isCollapsed={isCollapsed} />

        {/* Collapse Toggle - desktop only */}
        <button
          type="button"
          onClick={() => onCollapse(!isCollapsed)}
          aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          className={cn(
            "mt-2 hidden w-full items-center gap-3 rounded-xl p-2.5 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text lg:flex",
            isCollapsed && "justify-center"
          )}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronsLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Contraer</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
