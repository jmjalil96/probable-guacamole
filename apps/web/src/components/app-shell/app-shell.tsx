import { useState } from "react";
import { Menu } from "lucide-react";
import { useLocalStorage } from "@/lib/hooks";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center border-b border-border px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-text-muted hover:bg-border hover:text-text"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Page content */}
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-300"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
