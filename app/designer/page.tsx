"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { CanvasNode, Connection } from "./designer-data";
import { useProjects } from "./useProjects";
import EquipmentSidebar from "./EquipmentSidebar";
import DesignerToolbar from "./DesignerToolbar";
import ProjectTabs from "./ProjectTabs";
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

  const { projects, activeProjectId, setActiveProjectId, addProject, deleteProject, renameProject } =
    useProjects();

  // Clear parent state when switching projects
  useEffect(() => {
    setSelectedNodes([]);
    setAllNodes([]);
    setConnections([]);
  }, [activeProjectId]);

  return (
    <div className="flex h-full">
      <EquipmentSidebar collapsed={leftCollapsed} onToggle={() => setLeftCollapsed(!leftCollapsed)} />

      <div className="flex-1 flex flex-col">
        <DesignerToolbar activeView={activeView} onViewChange={setActiveView} />
        <ProjectTabs
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onAddProject={addProject}
          onDeleteProject={deleteProject}
          onRenameProject={renameProject}
        />
        <DesignerCanvas
          key={activeProjectId}
          projectId={activeProjectId}
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
        projectId={activeProjectId}
      />
    </div>
  );
}
