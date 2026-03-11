export type NodeType = "server" | "switch" | "workstation";

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

export const equipmentCategories: EquipmentCategory[] = [
  {
    name: "Workstations",
    expanded: true,
    items: [
      { id: "ws-1", name: "Dell OptiPlex 7090", type: "workstation" },
      { id: "ws-2", name: "HP EliteDesk 800", type: "workstation" },
      { id: "ws-3", name: "Lenovo ThinkCentre M90", type: "workstation" },
    ],
  },
  {
    name: "Servers",
    expanded: false,
    items: [
      { id: "srv-1", name: "Dell PowerEdge R750", type: "server" },
      { id: "srv-2", name: "HP ProLiant DL380", type: "server" },
    ],
  },
  {
    name: "Network",
    expanded: true,
    items: [
      { id: "net-1", name: "Cisco Catalyst 9300", type: "switch" },
      { id: "net-2", name: "Ubiquiti UniFi Switch", type: "switch" },
      { id: "net-3", name: "Aruba 2930F Series", type: "switch" },
    ],
  },
  {
    name: "Peripherals",
    expanded: false,
    items: [],
  },
];

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
