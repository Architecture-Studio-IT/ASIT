import { useState, useEffect } from "react";
import { Wallet, ChevronLeft, ChevronRight, Monitor, MousePointer, ArrowRight, ArrowLeft } from "lucide-react";
import type { CanvasNode, Connection } from "./designer-data";
import { defaultProperties } from "./designer-data";
import { typeIcons, typeLabels, STORAGE_KEYS } from "./constants";

interface PropertiesPanelProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  selectedNodes: CanvasNode[];
  allNodes: CanvasNode[];
  connections: Connection[];
}

const tabs = ["Properties", "Connections", "Notes"];

export default function PropertiesPanel({
  activeTab,
  onTabChange,
  collapsed,
  onToggle,
  selectedNodes,
  allNodes,
  connections,
}: PropertiesPanelProps) {
  const [selectedStorage, setSelectedStorage] = useState([defaultProperties.storage[0]]);
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }, [notes]);

  const toggleStorage = (s: string) => {
    setSelectedStorage((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  if (collapsed) {
    return (
      <aside className="w-10 shrink-0 border-l border-border bg-white flex flex-col items-center pt-3">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-surface transition-colors"
          title="Expand panel"
        >
          <ChevronLeft size={16} className="text-text-cool" />
        </button>
      </aside>
    );
  }

  const node = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const TypeIcon = node ? (typeIcons[node.type] || Monitor) : null;
  const selectedIds = new Set(selectedNodes.map((n) => n.id));

  const relevantConnections = connections.filter(
    (c) => selectedIds.has(c.from) || selectedIds.has(c.to)
  );

  const currentNote = node ? (notes[node.id] ?? "") : "";

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-white overflow-y-auto flex flex-col">
      {/* Header with toggle + node count */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-cool">Inspector</span>
          <span className="text-xs text-text-cool bg-surface rounded-full px-1.5 py-0.5">
            {allNodes.length}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-surface transition-colors"
          title="Collapse panel"
        >
          <ChevronRight size={16} className="text-text-cool" />
        </button>
      </div>

      {/* Selected node header */}
      {node && TypeIcon && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <TypeIcon size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{node.label.replace("\n", " ")}</p>
              <p className="text-xs text-text-cool">{typeLabels[node.type] || node.type}</p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-selection header */}
      {selectedNodes.length > 1 && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">{selectedNodes.length} elements selected</p>
          <p className="text-xs text-text-cool">Shift+click to modify selection</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-primary border-b-2 border-primary"
                : "text-text-cool hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Properties - empty state */}
      {selectedNodes.length === 0 && activeTab === "Properties" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-3">
            <MousePointer size={20} className="text-text-cool" />
          </div>
          <p className="text-sm font-medium text-text-cool">No element selected</p>
          <p className="text-xs text-text-cool mt-1">Click on a node to view its properties</p>
        </div>
      )}

      {/* Properties - form */}
      {selectedNodes.length > 0 && activeTab === "Properties" && (
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-base font-semibold mb-4">Configuration</h3>

          <div className="mb-4">
            <label className="text-sm text-text-cool mb-1.5 block">CPU Model</label>
            <select className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white">
              <option>{defaultProperties.cpuModel}</option>
              <option>Intel Core i9-12900</option>
              <option>AMD Ryzen 9 5900X</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-text-cool">RAM</label>
              <span className="text-sm font-medium">{defaultProperties.ram} GB</span>
            </div>
            <input
              type="range"
              min={8}
              max={128}
              step={8}
              defaultValue={defaultProperties.ram}
              className="w-full accent-primary"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm text-text-cool mb-1.5 block">Storage</label>
            <div className="flex flex-col gap-2">
              {defaultProperties.storage.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStorage.includes(s)}
                    onChange={() => toggleStorage(s)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-auto p-4 bg-primary rounded-xl text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Estimated Price</span>
              <Wallet size={16} className="opacity-70" />
            </div>
            <p className="text-2xl font-bold">
              ${defaultProperties.estimatedPrice.toLocaleString()}.00
            </p>
            <p className="text-xs text-accent mt-1">
              Per unit &bull; {selectedNodes.length} selected
            </p>
          </div>
        </div>
      )}

      {/* Connections - empty state */}
      {selectedNodes.length === 0 && activeTab === "Connections" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-text-cool">Select an element to see its connections.</p>
        </div>
      )}

      {/* Connections - list */}
      {selectedNodes.length > 0 && activeTab === "Connections" && (
        <div className="p-4 flex-1">
          {relevantConnections.length === 0 ? (
            <p className="text-sm text-text-cool">No connections.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {relevantConnections.map((c) => {
                const fromNode = allNodes.find((n) => n.id === c.from);
                const toNode = allNodes.find((n) => n.id === c.to);
                if (!fromNode || !toNode) return null;
                const isOutgoing = selectedIds.has(c.from);
                const otherNode = isOutgoing ? toNode : fromNode;
                const OtherIcon = typeIcons[otherNode.type] || Monitor;
                return (
                  <div
                    key={`${c.from}-${c.to}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border text-sm"
                  >
                    {isOutgoing ? (
                      <ArrowRight size={14} className="text-primary shrink-0" />
                    ) : (
                      <ArrowLeft size={14} className="text-primary shrink-0" />
                    )}
                    <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <OtherIcon size={12} className="text-primary" />
                    </div>
                    <span className="truncate">{otherNode.label.replace("\n", " ")}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notes - empty state */}
      {selectedNodes.length === 0 && activeTab === "Notes" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-text-cool">Select an element to add notes.</p>
        </div>
      )}

      {/* Notes - multi-selection */}
      {selectedNodes.length > 1 && activeTab === "Notes" && (
        <div className="p-5">
          <p className="text-sm text-text-cool">Select a single element to edit notes.</p>
        </div>
      )}

      {/* Notes - single selection */}
      {node && activeTab === "Notes" && (
        <div className="p-5">
          <textarea
            value={currentNote}
            onChange={(e) => setNotes((prev) => ({ ...prev, [node.id]: e.target.value }))}
            className="w-full h-32 text-sm border border-border rounded-lg p-3 resize-none"
            placeholder="Add notes about this element..."
          />
        </div>
      )}
    </aside>
  );
}
