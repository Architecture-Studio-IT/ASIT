import { Check, CloudOff, Download, Loader2, Undo, Redo } from "lucide-react";

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface DesignerToolbarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  saveStatus: SaveStatus;
}

const saveLabels: Record<SaveStatus, string> = {
  idle: "Enregistré",
  pending: "Modifications en attente…",
  saving: "Enregistrement…",
  saved: "Enregistré",
  error: "Échec de l'enregistrement",
};

export default function DesignerToolbar({ activeView, onViewChange, saveStatus }: DesignerToolbarProps) {
  const SaveIcon = saveStatus === "saving" ? Loader2 : saveStatus === "error" ? CloudOff : Check;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-white">
      <div className="flex items-center gap-2">
        <span
          role="status"
          aria-live="polite"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${
            saveStatus === "error" ? "bg-warning/10 text-warning" : "bg-surface text-text-cool"
          }`}
        >
          <SaveIcon size={14} className={saveStatus === "saving" ? "animate-spin" : ""} aria-hidden="true" />
          {saveLabels[saveStatus]}
        </span>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface transition-colors">
          <Download size={14} aria-hidden="true" />
          Exporter
        </button>
        <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />
        <button className="p-1.5 rounded-lg hover:bg-surface transition-colors" aria-label="Annuler" disabled>
          <Undo size={16} className="text-text-cool" aria-hidden="true" />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-surface transition-colors" aria-label="Rétablir" disabled>
          <Redo size={16} className="text-text-cool" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm" role="group" aria-label="Vue">
        <span className="text-text-cool">Vue :</span>
        {[
          { id: "Grid", label: "Grille" },
          { id: "Connections", label: "Liaisons" },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            aria-pressed={activeView === view.id}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              activeView === view.id ? "border-primary text-primary bg-primary/5" : "border-border hover:bg-surface"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}
