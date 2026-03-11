import { useState, useCallback, useEffect } from "react";
import { STORAGE_KEYS } from "./constants";

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

function generateId() {
  return `proj-${Date.now()}`;
}

const canUseStorage = typeof window !== "undefined";

/** Migrate legacy flat keys into the first project's namespaced keys */
function migrateLegacyData(projectId: string) {
  if (!canUseStorage) return;
  const legacyKeys = [
    { old: "designer-nodes", newKey: STORAGE_KEYS.NODES(projectId) },
    { old: "designer-connections", newKey: STORAGE_KEYS.CONNECTIONS(projectId) },
    { old: "designer-notes", newKey: STORAGE_KEYS.NOTES(projectId) },
  ];
  for (const { old, newKey } of legacyKeys) {
    const data = localStorage.getItem(old);
    if (data) {
      localStorage.setItem(newKey, data);
      localStorage.removeItem(old);
    }
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (!canUseStorage) return [{ id: "proj-1", name: "Project 1", createdAt: Date.now() }];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaultProject: Project = { id: "proj-1", name: "Project 1", createdAt: Date.now() };
    migrateLegacyData(defaultProject.id);
    return [defaultProject];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    if (!canUseStorage) return projects[0]?.id ?? "proj-1";
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT);
      if (saved) return saved;
    } catch {}
    return projects[0]?.id ?? "proj-1";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, activeProjectId);
  }, [activeProjectId]);

  const addProject = useCallback(() => {
    const id = generateId();
    const newProject: Project = {
      id,
      name: `Project ${projects.length + 1}`,
      createdAt: Date.now(),
    };
    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(id);
  }, [projects.length]);

  const deleteProject = useCallback(
    (id: string) => {
      if (projects.length <= 1) return;
      localStorage.removeItem(STORAGE_KEYS.NODES(id));
      localStorage.removeItem(STORAGE_KEYS.CONNECTIONS(id));
      localStorage.removeItem(STORAGE_KEYS.NOTES(id));

      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) {
        const remaining = projects.filter((p) => p.id !== id);
        setActiveProjectId(remaining[0]?.id ?? "");
      }
    },
    [projects, activeProjectId],
  );

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  return {
    projects,
    activeProjectId,
    setActiveProjectId,
    addProject,
    deleteProject,
    renameProject,
  };
}
