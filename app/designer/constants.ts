import { Monitor, Server, Wifi, HardDrive, Radio } from "lucide-react";

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
  router: { stroke: "#F59E0B" },
  access_point: { stroke: "#8B5CF6" },
  workstation: { stroke: "#E5E7EB" },
};

export const typeIcons: Record<string, typeof Monitor> = {
  server: Server,
  switch: Wifi,
  router: HardDrive,
  access_point: Radio,
  workstation: Monitor,
};

export const typeLabels: Record<string, string> = {
  server: "Server",
  switch: "Network Switch",
  router: "Router",
  access_point: "Access Point",
  workstation: "Workstation",
};

export const typePrices: Record<string, number> = {
  server: 4500,
  switch: 1200,
  router: 800,
  access_point: 350,
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
