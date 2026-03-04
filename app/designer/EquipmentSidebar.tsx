import { useState } from "react";
import { Search, Monitor, Server, Wifi, ChevronDown, ChevronRight } from "lucide-react";
import { equipmentCategories, type EquipmentItem } from "./designer-data";

const categoryIcons: Record<string, typeof Monitor> = {
  workstation: Monitor,
  server: Server,
  switch: Wifi,
};

export default function EquipmentSidebar() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(equipmentCategories.map((c) => [c.name, c.expanded]))
  );

  const toggleCategory = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleDragStart = (e: React.DragEvent, item: EquipmentItem) => {
    e.dataTransfer.setData(
      "application/equipment",
      JSON.stringify({ name: item.name, type: item.type })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-white overflow-y-auto">
      {/* Search */}
      <div className="p-3">
        <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm">
          <Search size={16} className="text-text-cool" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none bg-transparent text-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-3 pb-3">
        {equipmentCategories.map((category) => (
          <div key={category.name} className="mb-1">
            <button
              onClick={() => toggleCategory(category.name)}
              className="flex items-center justify-between w-full py-2.5 text-sm font-semibold hover:text-primary transition-colors"
            >
              {category.name}
              {expanded[category.name] ? (
                <ChevronDown size={16} className="text-text-cool" />
              ) : (
                <ChevronRight size={16} className="text-text-cool" />
              )}
            </button>

            {expanded[category.name] && category.items.length > 0 && (
              <div className="flex flex-col gap-1 mb-2">
                {category.items
                  .filter((item) =>
                    item.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((item) => {
                    const Icon = categoryIcons[item.type] || Monitor;
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg border border-border text-sm cursor-grab active:cursor-grabbing hover:bg-surface hover:border-primary/30 transition-colors select-none"
                      >
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <Icon size={14} className="text-primary" />
                        </div>
                        {item.name}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
