export type NodeType = "server" | "switch" | "router" | "access_point" | "workstation";

export interface EquipmentItem {
  id: string;
  name: string;
  type: NodeType;
}

export interface EquipmentCategory {
  name: string;
  expanded: boolean;
  items: EquipmentItem[];
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
}

export interface Waypoint {
  x: number;
  y: number;
}

export interface Connection {
  from: string;
  to: string;
  waypoints?: Waypoint[];
}


export const initialNodes: CanvasNode[] = [
  { id: "node-1", type: "server", label: "Main Server", x: 350, y: 60 },
  { id: "node-2", type: "switch", label: "Network Switch", x: 350, y: 280 },
  { id: "node-3", type: "workstation", label: "Workstation\n1", x: 150, y: 480 },
  { id: "node-4", type: "workstation", label: "Workstation\n2", x: 350, y: 480 },
  { id: "node-5", type: "workstation", label: "Workstation\n3", x: 550, y: 480 },
];

export const initialConnections: Connection[] = [
  { from: "node-1", to: "node-2" },
  { from: "node-2", to: "node-3" },
  { from: "node-2", to: "node-4" },
  { from: "node-2", to: "node-5" },
];

interface PropertyConfig {
  cpuModel: string;
  ram: number;
  storage: string[];
  estimatedPrice: number;
}

export const defaultProperties: PropertyConfig = {
  cpuModel: "Intel Core i7-12700",
  ram: 32,
  storage: ["512GB NVMe SSD", "1TB SATA SSD", "2TB HDD"],
  estimatedPrice: 2450,
};
