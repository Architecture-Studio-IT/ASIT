"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { CanvasNode, Connection } from "./designer-data";
import EquipmentSidebar from "./EquipmentSidebar";
import DesignerToolbar from "./DesignerToolbar";
import PropertiesPanel from "./PropertiesPanel";

const DesignerCanvas = dynamic(() => import("./DesignerCanvas"), { ssr: false });

export default function DesignerPage() {
  const [activeView, setActiveView] = useState("Grid");
  const [activeTab, setActiveTab] = useState("Properties");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<CanvasNode[]>([]);
  const [allNodes, setAllNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  return (
    <div className="flex h-full">
      <EquipmentSidebar collapsed={leftCollapsed} onToggle={() => setLeftCollapsed(!leftCollapsed)} />

      <div className="flex-1 flex flex-col">
        <DesignerToolbar activeView={activeView} onViewChange={setActiveView} />
        <DesignerCanvas
          onSelectionChange={setSelectedNodes}
          onNodesChange={setAllNodes}
          onConnectionsChange={setConnections}
        />
      </div>

      <PropertiesPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={rightCollapsed}
        onToggle={() => setRightCollapsed(!rightCollapsed)}
        selectedNodes={selectedNodes}
        allNodes={allNodes}
        connections={connections}
      />
    </div>
  );
}
