import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import type { EquipmentItem, EquipmentCategory } from "./designer-data";
import { typeIcons, typeLabelsPlural, DEFAULT_TYPE_ICON, EQUIPMENT_MIME_TYPE } from "./constants";
import { getProducts } from "../actions/products";

/** Catégorie = type de produit ; le libellé et l'icône viennent des constantes, avec repli générique. */
const categoryIcon = (type: string) => typeIcons[type] ?? DEFAULT_TYPE_ICON;
const categoryLabel = (type: string) => typeLabelsPlural[type] ?? type;

interface EquipmentSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function EquipmentSidebar({ collapsed, onToggle }: EquipmentSidebarProps) {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getProducts().then((products) => {
      const catMap = new Map<string, EquipmentItem[]>();

      for (const p of products) {
        if (!catMap.has(p.product_type)) catMap.set(p.product_type, []);
        catMap.get(p.product_type)!.push({
          id: `db-${p.id}`,
          // Libellé court (constructeur + modèle) : le titre Icecat complet ne tient pas dans un nœud.
          name: p.short_name,
          fullName: p.name,
          type: p.product_type,
          productId: p.id,
        });
      }

      const cats: EquipmentCategory[] = Array.from(catMap.entries()).map(([type, items]) => ({
        name: type,
        expanded: true,
        items,
      }));

      setCategories(cats);
      setExpanded(Object.fromEntries(cats.map((c) => [c.name, true])));
      setLoading(false);
    });
  }, []);

  const toggleCategory = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleDragStart = (e: React.DragEvent, item: EquipmentItem) => {
    e.dataTransfer.setData(
      EQUIPMENT_MIME_TYPE,
      JSON.stringify({ name: item.name, type: item.type, productId: item.productId })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  if (collapsed) {
    return (
      <aside className="w-12 shrink-0 border-r border-border bg-white flex flex-col items-center pt-3 gap-3">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-surface transition-colors"
          title="Expand panel"
        >
          <ChevronRight size={16} className="text-text-cool" />
        </button>
        <div className="w-6 h-px bg-border" />
        {categories.map((cat) => {
          const Icon = categoryIcon(cat.name);
          return (
            <button
              key={cat.name}
              onClick={onToggle}
              className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              title={categoryLabel(cat.name)}
              aria-label={categoryLabel(cat.name)}
            >
              <Icon size={14} className="text-primary" />
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-white overflow-y-auto">
      {/* Header with toggle */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span className="text-sm font-semibold text-text-cool">Équipements</span>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-surface transition-colors"
          title="Collapse panel"
        >
          <ChevronLeft size={16} className="text-text-cool" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm">
          <Search size={16} className="text-text-cool" />
          <input
            type="text"
            placeholder="Rechercher un équipement…"
            aria-label="Rechercher un équipement"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none bg-transparent text-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-3 pb-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="text-text-cool animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-text-cool text-center py-8">Aucun équipement dans le catalogue</p>
        ) : (
          categories.map((category) => {
            const CatIcon = categoryIcon(category.name);
            return (
              <div key={category.name} className="mb-1">
                <button
                  onClick={() => toggleCategory(category.name)}
                  aria-expanded={!!expanded[category.name]}
                  className="flex items-center justify-between w-full py-2.5 text-sm font-semibold hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CatIcon size={14} className="text-text-cool" aria-hidden="true" />
                    {categoryLabel(category.name)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {category.items.length > 0 && (
                      <span className="text-xs text-text-cool bg-surface rounded-full px-1.5 py-0.5">
                        {category.items.length}
                      </span>
                    )}
                    {expanded[category.name] ? (
                      <ChevronDown size={16} className="text-text-cool" />
                    ) : (
                      <ChevronRight size={16} className="text-text-cool" />
                    )}
                  </span>
                </button>

                {expanded[category.name] && category.items.length > 0 && (
                  <div className="flex flex-col gap-1 mb-2">
                    {category.items
                      .filter((item) =>
                        `${item.name} ${item.fullName ?? ""}`.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((item) => {
                        const Icon = typeIcons[item.type] ?? DEFAULT_TYPE_ICON;
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            title={item.fullName ?? item.name}
                            className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg border border-border text-sm cursor-grab active:cursor-grabbing active:opacity-50 hover:bg-surface hover:border-primary/30 transition-colors select-none"
                          >
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
                              <Icon size={14} className="text-primary" />
                            </div>
                            <span className="truncate">{item.name}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
