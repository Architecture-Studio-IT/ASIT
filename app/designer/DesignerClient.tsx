"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { CanvasNode, Connection } from "./designer-data";
import { useProjects, type Project } from "./useProjects";
import { getProject, saveProject, type ProjectData } from "../actions/projects";
import { SAVE_DEBOUNCE_MS } from "./constants";
import EquipmentSidebar from "./EquipmentSidebar";
import DesignerToolbar from "./DesignerToolbar";
import ProjectTabs from "./ProjectTabs";
import PropertiesPanel from "./PropertiesPanel";

import type { CanvasApi } from "./DesignerCanvas";

const DesignerCanvas = dynamic(() => import("./DesignerCanvas"), { ssr: false });

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export default function DesignerClient({
  initialProjects,
  initialActiveId,
}: {
  initialProjects: Project[];
  initialActiveId: string | null;
}) {
  const [activeView, setActiveView] = useState("Grid");
  const [activeTab, setActiveTab] = useState("Properties");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<CanvasNode[]>([]);

  const { projects, activeProjectId, setActiveProjectId, addProject, deleteProject, renameProject, error } =
    useProjects(initialProjects, initialActiveId);

  // Contenu du projet actif, chargé depuis la base à chaque changement d'onglet.
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  // Dernier état connu du canvas et du panneau, à persister.
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Vrai tant que l'état local vient de la base et non d'une modification utilisateur.
  const hydratingRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedNodes([]);
    hydratingRef.current = true;

    getProject(activeProjectId).then((data) => {
      if (cancelled) return;
      setProjectData(data);
      setNodes(data?.nodes ?? []);
      setConnections(data?.connections ?? []);
      setNotes(data?.notes ?? {});
      setSaveStatus("idle");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeProjectId]);

  // Une fois le projet affiché, les changements suivants sont des modifications à enregistrer.
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => {
        hydratingRef.current = false;
      }, 0);
      return () => clearTimeout(t);
    }
  }, [loading, activeProjectId]);

  // Enregistrement différé : on attend une pause dans les modifications.
  useEffect(() => {
    if (loading || hydratingRef.current || !projectData) return;
    setSaveStatus("pending");
    const id = activeProjectId;
    const t = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await saveProject(id, { nodes, connections, notes });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [nodes, connections, notes, activeProjectId, loading, projectData]);

  const handleNodesChange = useCallback((n: CanvasNode[]) => setNodes(n), []);
  const handleConnectionsChange = useCallback((c: Connection[]) => setConnections(c), []);

  const [canvasApi, setCanvasApi] = useState<CanvasApi | null>(null);
  const handleCanvasReady = useCallback((api: CanvasApi) => setCanvasApi(api), []);
  const handleUpdateNode = useCallback(
    (id: string, patch: Partial<Omit<CanvasNode, "id">>) => {
      canvasApi?.updateNode(id, patch);
      setSelectedNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    },
    [canvasApi],
  );

  return (
    <div className="flex h-full">
      <EquipmentSidebar collapsed={leftCollapsed} onToggle={() => setLeftCollapsed(!leftCollapsed)} />

      <div className="flex-1 flex flex-col min-w-0">
        <DesignerToolbar activeView={activeView} onViewChange={setActiveView} saveStatus={saveStatus} />
        <ProjectTabs
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onAddProject={addProject}
          onDeleteProject={deleteProject}
          onRenameProject={renameProject}
        />
        {error && (
          <p className="px-4 py-1 text-xs text-warning" role="alert">
            {error}
          </p>
        )}
        {loading || !projectData ? (
          <div className="flex flex-1 items-center justify-center bg-surface" role="status" aria-live="polite">
            <Loader2 size={22} className="animate-spin text-text-cool" aria-hidden="true" />
            <span className="sr-only">Chargement du projet</span>
          </div>
        ) : (
          <DesignerCanvas
            key={projectData.id}
            initialNodes={projectData.nodes}
            initialConnections={projectData.connections}
            onSelectionChange={setSelectedNodes}
            onNodesChange={handleNodesChange}
            onConnectionsChange={handleConnectionsChange}
            onReady={handleCanvasReady}
          />
        )}
      </div>

      <PropertiesPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={rightCollapsed}
        onToggle={() => setRightCollapsed(!rightCollapsed)}
        selectedNodes={selectedNodes}
        allNodes={nodes}
        connections={connections}
        notes={notes}
        onNotesChange={setNotes}
        onUpdateNode={handleUpdateNode}
      />
    </div>
  );
}
