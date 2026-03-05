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

// ── Color palette (hex) ───────────────────────────────────
// Source of truth for Tailwind: globals.css @theme
// Use these for non-CSS contexts (Konva canvas, dynamic styles)
export const COLORS = {
  primary: "#0D7A8A",
  accent: "#42EB90",
  warning: "#EB6F42",
  textWarm: "#6B5A54",
  textCool: "#54686B",
  background: "#F8FAFB",
  foreground: "#1a1a2e",
  surface: "#F8FAFB",
  border: "#E5E7EB",
} as const;
