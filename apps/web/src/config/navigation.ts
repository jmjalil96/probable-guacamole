import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Building2,
  Users,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
}

export const navigation: NavItem[] = [
  {
    label: "Inicio",
    to: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Nuevo Reclamo",
    to: "/new-claim",
    icon: FilePlus,
  },
  {
    label: "Reclamos",
    to: "/claims",
    icon: FileText,
  },
  {
    label: "Aseguradoras",
    to: "/insurers",
    icon: Building2,
  },
  {
    label: "Clientes",
    to: "/clients",
    icon: Users,
  },
  {
    label: "Usuarios",
    to: "/users",
    icon: UserCog,
  },
];
