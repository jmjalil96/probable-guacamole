import { LayoutDashboard, FilePlus, FileText, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
}

export const navigation: NavItem[] = [
  {
    label: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Nuevo Reclamo",
    to: "/new-claim",
    icon: FilePlus,
  },
  {
    label: "Claims",
    to: "/claims",
    icon: FileText,
  },
];
