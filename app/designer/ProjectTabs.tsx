import { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import type { Project } from "./useProjects";

interface ProjectTabsProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onAddProject: () => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
}

export default function ProjectTabs({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  onRenameProject,
}: ProjectTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      onRenameProject(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center gap-1 px-3 py-1 border-b border-border bg-white overflow-x-auto">
      {projects.map((project) => {
        const isActive = project.id === activeProjectId;
        const isEditing = editingId === project.id;

        return (
          <div
            key={project.id}
            className={`group flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border cursor-pointer select-none transition-colors ${
              isActive
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-text-cool hover:bg-surface hover:border-border"
            }`}
            onClick={() => onSelectProject(project.id)}
            onDoubleClick={() => {
              setEditingId(project.id);
              setEditValue(project.name);
            }}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-24 text-sm bg-transparent outline-none border-b border-primary"
              />
            ) : (
              <span className="truncate max-w-[120px]">{project.name}</span>
            )}

            {projects.length > 1 && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(project.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-border/50 transition-opacity"
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}

      <button
        onClick={onAddProject}
        className="p-1.5 rounded-lg hover:bg-surface transition-colors text-text-cool hover:text-primary"
        title="New project"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
