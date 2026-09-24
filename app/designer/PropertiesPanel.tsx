import { useState, useEffect } from "react";
import { Wallet, ChevronLeft, ChevronRight, MousePointer, ArrowRight, ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import type { CanvasNode, Connection } from "./designer-data";
import { typeIcons, typeLabels, DEFAULT_TYPE_ICON } from "./constants";
import { getProductById, type ProductData } from "../actions/products";
import { priceSearchLinks } from "@/lib/vendor-links";

interface PropertiesPanelProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  selectedNodes: CanvasNode[];
  allNodes: CanvasNode[];
  connections: Connection[];
  notes: Record<string, string>;
  onNotesChange: (notes: Record<string, string>) => void;
  onUpdateNode: (id: string, patch: Partial<Omit<CanvasNode, "id">>) => void;
}

const tabs = [
  { id: "Properties", label: "Propriétés" },
  { id: "Connections", label: "Liaisons" },
  { id: "Budget", label: "Budget" },
  { id: "Notes", label: "Notes" },
];

const euro = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;
const inputClass = "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary";

/** Lignes de caractéristiques à afficher, selon le type de produit. */
function specRows(p: ProductData): [string, string][] {
  const rows: [string, string][] = [];
  const add = (label: string, v: string | number | boolean | null | undefined, unit = "") => {
    if (v === null || v === undefined || v === "" || v === false) return;
    rows.push([label, v === true ? "Oui" : `${v}${unit}`]);
  };
  add("Référence", p.sku);
  add("Constructeur", p.manufacturer);
  if (p.server) {
    add("Processeur", p.server.cpu_model);
    add("Cœurs", p.server.cpu_cores);
    add("Fréquence", p.server.cpu_frequency);
    add("Mémoire", p.server.ram_gb, " Go");
    add("Type mémoire", p.server.ram_type);
    add("Mémoire max", p.server.ram_max_gb, " Go");
    add("Stockage", p.server.storage_capacity);
    add("Format", p.server.server_format ?? p.server.case_format);
    add("Hauteur rack", p.server.rack_units, " U");
    add("Alimentation", p.server.power_watts, " W");
    add("Alimentation redondante", p.server.redundant_psu);
  }
  if (p.switch) {
    add("Couche", p.switch.layer);
    add("Manageable", p.switch.managed);
    add("PoE", p.switch.poe_support);
    add("Budget PoE", p.switch.poe_budget_watts, " W");
    add("Capacité de commutation", p.switch.switching_capacity_gbps, " Gbit/s");
    add("Hauteur rack", p.switch.rack_units, " U");
  }
  if (p.router) {
    add("Wi-Fi", p.router.wifi_standard);
    add("VPN", p.router.vpn_support);
    add("Débit max", p.router.max_throughput_mbps, " Mbit/s");
  }
  if (p.accessPoint) {
    add("Wi-Fi", p.accessPoint.wifi_standard);
    add("Débit max", p.accessPoint.max_throughput_mbps, " Mbit/s");
    add("PoE", p.accessPoint.poe_support);
    add("Extérieur", p.accessPoint.outdoor);
  }
  if (!p.server && !p.switch && !p.router && !p.accessPoint) {
    for (const h of p.highlights) {
      const [k, ...v] = h.split(" : ");
      add(k, v.join(" : "));
    }
  }
  add("Garantie", p.warranty);
  return rows;
}

export default function PropertiesPanel({
  activeTab,
  onTabChange,
  collapsed,
  onToggle,
  selectedNodes,
  allNodes,
  connections,
  notes,
  onNotesChange,
  onUpdateNode,
}: PropertiesPanelProps) {
  const node = selectedNodes.length === 1 ? selectedNodes[0] : null;

  // Fiche catalogue du nœud sélectionné, quand il en a une.
  const [product, setProduct] = useState<ProductData | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const productId = node?.productId;

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }
    let cancelled = false;
    setProductLoading(true);
    getProductById(productId).then((p) => {
      if (cancelled) return;
      setProduct(p);
      setProductLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (collapsed) {
    return (
      <aside className="w-10 shrink-0 border-l border-border bg-white flex flex-col items-center pt-3">
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-surface transition-colors" aria-label="Déplier le panneau">
          <ChevronLeft size={16} className="text-text-cool" aria-hidden="true" />
        </button>
      </aside>
    );
  }

  const TypeIcon = node ? typeIcons[node.type] ?? DEFAULT_TYPE_ICON : null;
  const selectedIds = new Set(selectedNodes.map((n) => n.id));
  const relevantConnections = connections.filter((c) => selectedIds.has(c.from) || selectedIds.has(c.to));
  const currentNote = node ? (notes[node.id] ?? "") : "";

  // Budget : uniquement les prix relevés par l'utilisateur. Aucune estimation.
  const pricedNodes = allNodes.filter((n) => n.price != null);
  const quotedTotal = pricedNodes.reduce((sum, n) => sum + (n.price ?? 0), 0);
  const unpricedNodes = allNodes.filter((n) => n.price == null);

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-white overflow-y-auto flex flex-col" aria-label="Inspecteur">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-cool">Inspecteur</span>
          <span className="text-xs text-text-cool bg-surface rounded-full px-1.5 py-0.5">{allNodes.length}</span>
        </div>
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-surface transition-colors" aria-label="Replier le panneau">
          <ChevronRight size={16} className="text-text-cool" aria-hidden="true" />
        </button>
      </div>

      {node && TypeIcon && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
              <TypeIcon size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{node.label.replace("\n", " ")}</p>
              <p className="text-xs text-text-cool">{typeLabels[node.type] || node.type}</p>
            </div>
          </div>
        </div>
      )}

      {selectedNodes.length > 1 && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">{selectedNodes.length} éléments sélectionnés</p>
          <p className="text-xs text-text-cool">Maj+clic pour modifier la sélection</p>
        </div>
      )}

      <div className="flex border-b border-border" role="tablist" aria-label="Sections de l'inspecteur">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id ? "text-primary border-b-2 border-primary" : "text-text-cool hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Propriétés */}
      {activeTab === "Properties" && selectedNodes.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-3" aria-hidden="true">
            <MousePointer size={20} className="text-text-cool" />
          </div>
          <p className="text-sm font-medium text-text-cool">Aucun élément sélectionné</p>
          <p className="text-xs text-text-cool mt-1">Cliquez sur un nœud pour afficher ses propriétés</p>
        </div>
      )}

      {activeTab === "Properties" && node && (
        <div className="p-5 flex-1 flex flex-col gap-4">
          {!node.productId && (
            <p className="text-sm text-text-cool">Élément générique, sans fiche catalogue.</p>
          )}
          {node.productId && productLoading && (
            <p className="text-sm text-text-cool" role="status">
              Chargement de la fiche…
            </p>
          )}
          {product && (
            <>
              {product.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt="" className="h-28 w-full rounded-lg border border-border object-contain bg-white" />
              )}
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                {specRows(product).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-text-cool">{k}</dt>
                    <dd className="font-medium break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {product.datasheet_url && (
                  <a
                    href={product.datasheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline"
                  >
                    <ExternalLink size={13} aria-hidden="true" />
                    Fiche technique (PDF)
                  </a>
                )}
                {product.scraped_url && (
                  <a
                    href={product.scraped_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline"
                  >
                    <ExternalLink size={13} aria-hidden="true" />
                    Fiche source
                  </a>
                )}
              </div>
              <p className="text-[11px] text-text-cool">
                Source : {product.source === "icecat" ? "Icecat, Open Content License" : product.source}
              </p>
            </>
          )}

          {/* Prix : relevé par l'utilisateur, jamais estimé */}
          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
            {product && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-cool">Comparer les prix</span>
                <div className="flex flex-wrap gap-2">
                  {priceSearchLinks(product.manufacturer, product.model, product.sku, product.gtin).map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-surface"
                    >
                      <ExternalLink size={12} aria-hidden="true" />
                      {link.label}
                    </a>
                  ))}
                </div>
                {product.best_offer && (
                  <span className="inline-flex items-center rounded-lg bg-surface px-2.5 py-1.5 text-xs text-text-cool">
                    {euro(product.best_offer.price_cents / 100)} HT constaté chez {product.best_offer.merchant}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="node-price" className="text-sm font-medium">
                Prix relevé <span className="font-normal text-text-cool">(€ HT)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="node-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  value={node.price ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    onUpdateNode(node.id, { price: v === "" ? undefined : Math.max(0, Number(v)) });
                  }}
                  placeholder="ex. 1 249,00"
                  className={inputClass}
                  aria-describedby="node-price-hint"
                />
                {node.price != null && (
                  <button
                    type="button"
                    onClick={() => onUpdateNode(node.id, { price: undefined, priceNote: undefined })}
                    className="rounded-lg border border-border px-2 text-text-cool hover:bg-surface"
                    aria-label="Effacer le prix relevé"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <input
                id="node-price-note"
                type="text"
                maxLength={120}
                value={node.priceNote ?? ""}
                onChange={(e) => onUpdateNode(node.id, { priceNote: e.target.value || undefined })}
                placeholder="Source et date : « devis Bechtle 18/09 »"
                className={inputClass}
                aria-label="Source et date du prix relevé"
              />
              <p id="node-price-hint" className="text-xs text-text-cool">
                Le prix que vous avez constaté ou négocié. Il n&apos;engage que sa source.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Properties" && selectedNodes.length > 1 && (
        <div className="p-5">
          <p className="text-sm text-text-cool">Sélectionnez un seul élément pour voir ses propriétés.</p>
        </div>
      )}

      {/* Liaisons */}
      {activeTab === "Connections" && selectedNodes.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-text-cool">Sélectionnez un élément pour voir ses liaisons.</p>
        </div>
      )}

      {activeTab === "Connections" && selectedNodes.length > 0 && (
        <div className="p-4 flex-1">
          {relevantConnections.length === 0 ? (
            <p className="text-sm text-text-cool">Aucune liaison.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {relevantConnections.map((c) => {
                const fromNode = allNodes.find((n) => n.id === c.from);
                const toNode = allNodes.find((n) => n.id === c.to);
                if (!fromNode || !toNode) return null;
                const isOutgoing = selectedIds.has(c.from);
                const otherNode = isOutgoing ? toNode : fromNode;
                const OtherIcon = typeIcons[otherNode.type] ?? DEFAULT_TYPE_ICON;
                const connKey = `${c.from}->>${c.to}`;
                return (
                  <li key={connKey} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border text-sm">
                      {isOutgoing ? (
                        <ArrowRight size={14} className="text-primary shrink-0" aria-label="vers" />
                      ) : (
                        <ArrowLeft size={14} className="text-primary shrink-0" aria-label="depuis" />
                      )}
                      <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
                        <OtherIcon size={12} className="text-primary" />
                      </div>
                      <span className="truncate">{otherNode.label.replace("\n", " ")}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Budget */}
      {activeTab === "Budget" && (
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-base font-semibold mb-1">Budget</h3>
          <p className="text-xs text-text-cool mb-4">Somme des prix relevés, hors taxes. Aucune estimation n&apos;est ajoutée.</p>

          {allNodes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Wallet size={24} className="text-text-cool mb-2" aria-hidden="true" />
              <p className="text-sm text-text-cool">Ajoutez des équipements, puis relevez leurs prix.</p>
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-2 mb-4">
                {pricedNodes.map((n) => {
                  const Icon = typeIcons[n.type] ?? DEFAULT_TYPE_ICON;
                  return (
                    <li key={n.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
                        <Icon size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.label.replace("\n", " ")}</p>
                        <p className="text-xs text-text-cool truncate">{n.priceNote ?? typeLabels[n.type] ?? n.type}</p>
                      </div>
                      <span className="text-sm font-semibold">{euro(n.price ?? 0)}</span>
                    </li>
                  );
                })}
              </ul>

              {unpricedNodes.length > 0 && (
                <p className="text-xs text-text-cool py-2 border-t border-border" role="status">
                  {unpricedNodes.length} équipement{unpricedNodes.length !== 1 ? "s" : ""} sans prix relevé :{" "}
                  {unpricedNodes
                    .slice(0, 3)
                    .map((n) => n.label.replace("\n", " "))
                    .join(", ")}
                  {unpricedNodes.length > 3 ? "…" : ""}
                </p>
              )}

              <div className="mt-auto p-4 bg-primary rounded-xl text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium opacity-90">Total relevé</span>
                  <Wallet size={16} className="opacity-70" aria-hidden="true" />
                </div>
                <p className="text-2xl font-bold">{euro(quotedTotal)}</p>
                <p className="text-xs text-accent mt-1">
                  {pricedNodes.length}/{allNodes.length} équipement{allNodes.length !== 1 ? "s" : ""} chiffré
                  {pricedNodes.length !== 1 ? "s" : ""} · {connections.length} liaison{connections.length !== 1 ? "s" : ""} (câblage non chiffré)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Notes */}
      {activeTab === "Notes" && selectedNodes.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-text-cool">Sélectionnez un élément pour ajouter une note.</p>
        </div>
      )}

      {activeTab === "Notes" && selectedNodes.length > 1 && (
        <div className="p-5">
          <p className="text-sm text-text-cool">Sélectionnez un seul élément pour éditer sa note.</p>
        </div>
      )}

      {activeTab === "Notes" && node && (
        <div className="p-5">
          <label htmlFor="node-note" className="sr-only">
            Note pour {node.label}
          </label>
          <textarea
            id="node-note"
            value={currentNote}
            onChange={(e) => onNotesChange({ ...notes, [node.id]: e.target.value })}
            className="w-full h-32 text-sm border border-border rounded-lg p-3 resize-none"
            placeholder="Ajouter une note sur cet élément…"
          />
        </div>
      )}
    </aside>
  );
}
