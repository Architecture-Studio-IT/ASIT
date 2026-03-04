import { useState } from "react";
import { Wallet } from "lucide-react";
import { defaultProperties } from "./designer-data";

interface PropertiesPanelProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = ["Properties", "Connections", "Notes"];

export default function PropertiesPanel({ activeTab, onTabChange }: PropertiesPanelProps) {
  const [selectedStorage, setSelectedStorage] = useState([defaultProperties.storage[0]]);

  const toggleStorage = (s: string) => {
    setSelectedStorage((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-white overflow-y-auto flex flex-col">
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

      {activeTab === "Properties" && (
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-base font-semibold mb-4">Configuration</h3>

          {/* CPU Model */}
          <div className="mb-4">
            <label className="text-sm text-text-cool mb-1.5 block">CPU Model</label>
            <select className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white">
              <option>{defaultProperties.cpuModel}</option>
              <option>Intel Core i9-12900</option>
              <option>AMD Ryzen 9 5900X</option>
            </select>
          </div>

          {/* RAM */}
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

          {/* Storage */}
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

          {/* Estimated Price */}
          <div className="mt-auto p-4 bg-primary rounded-xl text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Estimated Price</span>
              <Wallet size={16} className="opacity-70" />
            </div>
            <p className="text-2xl font-bold">
              ${defaultProperties.estimatedPrice.toLocaleString()}.00
            </p>
            <p className="text-xs text-accent mt-1">
              Per unit &bull; {defaultProperties.selectedCount} selected
            </p>
          </div>
        </div>
      )}

      {activeTab === "Connections" && (
        <div className="p-5">
          <p className="text-sm text-text-cool">Connection details will appear here when a link is selected.</p>
        </div>
      )}

      {activeTab === "Notes" && (
        <div className="p-5">
          <textarea
            className="w-full h-32 text-sm border border-border rounded-lg p-3 resize-none"
            placeholder="Add notes about this element..."
          />
        </div>
      )}
    </aside>
  );
}
