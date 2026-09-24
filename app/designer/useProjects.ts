import { useState, useCallback } from "react";
import {
  createProject as createProjectAction,
  deleteProject as deleteProjectAction,
  renameProject as renameProjectAction,
  type ProjectSummary,
} from "../actions/projects";

export type Project = ProjectSummary;

/**
 * Liste des projets de l'utilisateur, persistée en base via les actions serveur.
 * L'état local est mis à jour de façon optimiste puis réconcilié.
 */
export function useProjects(initialProjects: Project[], initialActiveId: string | null) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>(
    initialActiveId ?? initialProjects[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const addProject = useCallback(async () => {
    try {
      const created = await createProjectAction();
      setProjects((prev) => [created, ...prev]);
      setActiveProjectId(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible");
    }
  }, []);

  const deleteProject = useCallback(
    async (id: string) => {
      if (projects.length <= 1) return;
      const remaining = projects.filter((p) => p.id !== id);
      setProjects(remaining);
      if (activeProjectId === id) setActiveProjectId(remaining[0]?.id ?? "");
      try {
        await deleteProjectAction(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Suppression impossible");
        setProjects(projects);
      }
    },
    [projects, activeProjectId],
  );

  const renameProject = useCallback(async (id: string, name: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    try {
      await renameProjectAction(id, name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Renommage impossible");
    }
  }, []);

  return {
    projects,
    activeProjectId,
    setActiveProjectId,
    addProject,
    deleteProject,
    renameProject,
    error,
  };
}
