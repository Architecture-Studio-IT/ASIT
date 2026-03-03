import { Save, Download, Undo, Redo } from "lucide-react";

interface DesignerToolbarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function DesignerToolbar({ activeView, onViewChange }: DesignerToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-white">
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-accent text-[#1a1a2e] rounded-lg hover:bg-accent/90 transition-colors">
          <Save size={14} />
          Save
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface transition-colors">
          <Download size={14} />
          Export
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button className="p-1.5 rounded-lg hover:bg-surface transition-colors">
          <Undo size={16} className="text-text-cool" />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-surface transition-colors">
          <Redo size={16} className="text-text-cool" />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-cool">View:</span>
        {["Grid", "Connections"].map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              activeView === view
                ? "border-primary text-primary bg-primary/5"
                : "border-border hover:bg-surface"
            }`}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
}
