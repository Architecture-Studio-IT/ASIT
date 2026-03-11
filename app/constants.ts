import { LayoutDashboard, PenTool, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Branding ──────────────────────────────────────────────
export const APP_NAME = "ITAS";
export const APP_LOGO = "IT";

// ── Navigation ────────────────────────────────────────────
export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/designer", label: "Designer", icon: PenTool },
  { href: "/marketplace", label: "Marketplace", icon: Store },
];
