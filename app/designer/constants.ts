import { Monitor, Server, Wifi } from "lucide-react";

export const GRID_SIZE = 20;
export const NODE_W = 140;
export const NODE_H = 130;
export const NODE_PADDING = 20;
export const PORT_RADIUS = 5;
export const WAYPOINT_RADIUS = 5;
export const ACCENT_COLOR = "#0D7A8A";
export const SELECTED_COLOR = "#E5483E";

export const typeColors: Record<string, { stroke: string }> = {
  server: { stroke: "#42EB90" },
  switch: { stroke: ACCENT_COLOR },
  workstation: { stroke: "#E5E7EB" },
};

export const typeIcons: Record<string, typeof Monitor> = {
  server: Server,
  switch: Wifi,
  workstation: Monitor,
};

export const typeLabels: Record<string, string> = {
  server: "Server",
  switch: "Network Switch",
  workstation: "Workstation",
};

export const typePrices: Record<string, number> = {
  server: 4500,
  switch: 1200,
  workstation: 2450,
};

export const STORAGE_KEYS = {
  PROJECTS: "designer-projects",
  ACTIVE_PROJECT: "designer-active-project",
  NODES: (projectId: string) => `designer-nodes-${projectId}`,
  CONNECTIONS: (projectId: string) => `designer-connections-${projectId}`,
  NOTES: (projectId: string) => `designer-notes-${projectId}`,
} as const;

export const EQUIPMENT_MIME_TYPE = "application/equipment";
