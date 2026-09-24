import {
  Monitor,
  Server,
  Wifi,
  HardDrive,
  Radio,
  Laptop,
  Keyboard,
  Mouse,
  Printer,
  BatteryCharging,
  Database,
  Archive,
  Box,
} from "lucide-react";

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
  workstation: { stroke: "#94A3B8" },
  laptop: { stroke: "#94A3B8" },
  monitor: { stroke: "#64748B" },
  keyboard: { stroke: "#A3A3A3" },
  mouse: { stroke: "#A3A3A3" },
  printer: { stroke: "#78716C" },
  ups: { stroke: "#EAB308" },
  nas: { stroke: "#22C55E" },
  rack: { stroke: "#475569" },
};
export const DEFAULT_TYPE_COLOR = { stroke: "#CBD5E1" };

export const typeIcons: Record<string, typeof Monitor> = {
  server: Server,
  switch: Wifi,
  router: HardDrive,
  access_point: Radio,
  workstation: Monitor,
  laptop: Laptop,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  printer: Printer,
  ups: BatteryCharging,
  nas: Database,
  rack: Archive,
};
export const DEFAULT_TYPE_ICON = Box;

export const typeLabels: Record<string, string> = {
  server: "Serveur",
  switch: "Switch réseau",
  router: "Routeur",
  access_point: "Point d'accès",
  workstation: "Poste de travail",
  laptop: "Ordinateur portable",
  monitor: "Écran",
  keyboard: "Clavier",
  mouse: "Souris",
  printer: "Imprimante",
  ups: "Onduleur",
  nas: "NAS",
  rack: "Baie rack",
};

/** Libellé au pluriel pour les catégories de la sidebar. */
export const typeLabelsPlural: Record<string, string> = {
  server: "Serveurs",
  switch: "Switches",
  router: "Routeurs",
  access_point: "Points d'accès",
  workstation: "Postes de travail",
  laptop: "Ordinateurs portables",
  monitor: "Écrans",
  keyboard: "Claviers",
  mouse: "Souris",
  printer: "Imprimantes",
  ups: "Onduleurs",
  nas: "NAS",
  rack: "Baies rack",
};


/** Délai avant enregistrement d'un projet modifié, en millisecondes. */
export const SAVE_DEBOUNCE_MS = 800;

export const EQUIPMENT_MIME_TYPE = "application/equipment";
