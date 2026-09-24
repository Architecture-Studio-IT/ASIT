"use client";

import { useState, useMemo } from "react";
import {
  Search,
  List,
  LayoutGrid,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import type { ProductData } from "../actions/products";
import { typeIcons, typeLabels, DEFAULT_TYPE_ICON } from "../designer/constants";
import { priceSearchLinks } from "@/lib/vendor-links";

const euro = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;

/** Prix : la meilleure offre constatée si elle existe ; sinon un lien vers le constructeur, jamais une estimation. */
function PriceTag({ p, compact = false }: { p: ProductData; compact?: boolean }) {
  if (p.best_offer) {
    return (
      <div className={compact ? "text-right" : ""}>
        <p className="text-base font-semibold">{euro(p.best_offer.price_cents / 100)} <span className="text-xs font-normal text-text-cool">HT</span></p>
        <p className="text-xs text-text-cool">
          {p.best_offer.url ? (
            <a href={p.best_offer.url} target="_blank" rel="noopener noreferrer sponsored" className="hover:text-primary underline-offset-2 hover:underline">
              chez {p.best_offer.merchant}
            </a>
          ) : (
            <>chez {p.best_offer.merchant}</>
          )}
          {p.offer_count > 1 && ` · ${p.offer_count} offres`}
        </p>
      </div>
    );
  }
  const links = priceSearchLinks(p.manufacturer, p.model, p.sku, p.gtin);
  return (
    <div className={compact ? "text-right" : ""}>
      <p className="text-xs text-text-cool mb-1">Comparer les prix</p>
      <div className={`flex flex-wrap gap-x-3 gap-y-1 ${compact ? "justify-end" : ""}`}>
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            <ExternalLink size={12} aria-hidden="true" />
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function getSpecs(p: ProductData): string {
  if (p.server) {
    const parts: string[] = [];
    if (p.server.cpu_model) parts.push(p.server.cpu_model);
    if (p.server.ram_gb) parts.push(`${p.server.ram_gb}GB ${p.server.ram_type ?? "RAM"}`);
    if (p.server.storage_capacity) parts.push(p.server.storage_capacity);
    if (p.server.case_format) parts.push(p.server.case_format);
    return parts.join(" | ") || p.sku;
  }
  if (p.switch) {
    const parts: string[] = [];
    if (p.switch.layer) parts.push(`Layer ${p.switch.layer}`);
    if (p.switch.managed) parts.push("Managed");
    if (p.switch.poe_support) parts.push(`PoE ${p.switch.poe_budget_watts ? `${p.switch.poe_budget_watts}W` : ""}`);
    return parts.join(" | ") || p.sku;
  }
  if (p.router) {
    const parts: string[] = [];
    if (p.router.wifi_standard) parts.push(p.router.wifi_standard);
    if (p.router.vpn_support) parts.push("VPN");
    if (p.router.max_throughput_mbps) parts.push(`${p.router.max_throughput_mbps} Mbps`);
    return parts.join(" | ") || p.sku;
  }
  if (p.accessPoint) {
    const parts: string[] = [];
    if (p.accessPoint.wifi_standard) parts.push(p.accessPoint.wifi_standard);
    if (p.accessPoint.max_throughput_mbps) parts.push(`${p.accessPoint.max_throughput_mbps} Mbps`);
    if (p.accessPoint.outdoor) parts.push("Extérieur");
    return parts.join(" | ") || p.sku;
  }
  // Types sans table dédiée : les premières caractéristiques du catalogue.
  return p.highlights.slice(0, 3).join(" | ") || p.sku;
}

/** Tri par prix : les produits sans prix connu passent en dernier. */
const priceOf = (p: ProductData) => p.best_offer?.price_cents ?? Number.MAX_SAFE_INTEGER;

function getTags(p: ProductData): string[] {
  const tags: string[] = [];
  if (p.server) {
    if (p.server.redundant_psu) tags.push("Redundant PSU");
    if (p.server.power_watts) tags.push(`${p.server.power_watts}W`);
    if (p.server.barebone) tags.push("Barebone");
  }
  if (p.switch) {
    if (p.switch.power_watts) tags.push(`${p.switch.power_watts}W`);
  }
  if (p.warranty) tags.push(p.warranty);
  return tags;
}

const sortOptions = [
  { value: "name", label: "Nom" },
  { value: "manufacturer", label: "Constructeur" },
  { value: "type", label: "Type" },
  { value: "price", label: "Prix croissant" },
];

interface MarketplaceClientProps {
  products: ProductData[];
  manufacturers: string[];
  productTypes: string[];
}

export default function MarketplaceClient({ products, manufacturers, productTypes }: MarketplaceClientProps) {
  const [search, setSearch] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  const toggleType = (t: string) =>
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const resetFilters = () => {
    setSelectedBrands([]);
    setSelectedTypes([]);
    setSearch("");
  };

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.manufacturer.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q))
          return false;
      }
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.manufacturer)) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.product_type)) return false;
      return true;
    });

    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "manufacturer") list.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer));
    else if (sortBy === "type") list.sort((a, b) => a.product_type.localeCompare(b.product_type));
    else if (sortBy === "price") list.sort((a, b) => priceOf(a) - priceOf(b));

    return list;
  }, [products, search, selectedBrands, selectedTypes, sortBy]);

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="px-6 py-2 text-sm text-text-cool border-b border-border bg-white flex items-center gap-1.5">
        <span>Accueil</span>
        <ChevronRight size={12} aria-hidden="true" />
        <h1 className="text-foreground font-medium">Catalogue</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar filters */}
        <aside className="w-56 shrink-0 border-r border-border bg-white p-5 overflow-y-auto">
          <h2 className="text-base font-semibold mb-5">Filtres</h2>

          {/* Search */}
          <div className="mb-5">
            <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm">
              <Search size={14} className="text-text-cool shrink-0" />
              <input
                type="text"
                placeholder="Rechercher…"
                aria-label="Rechercher un produit"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>
          </div>

          {/* Manufacturer */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold mb-2.5">Constructeur</h3>
            <div className="flex flex-col gap-2">
              {manufacturers.map((b) => (
                <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={() => toggleBrand(b)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  {b}
                </label>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold mb-2.5">Type</h3>
            <div className="flex flex-col gap-2">
              {productTypes.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(t)}
                    onChange={() => toggleType(t)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  {typeLabels[t] ?? t}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={resetFilters}
            className="w-full py-2.5 text-sm border border-border rounded-lg hover:bg-surface transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-white">
            <span className="text-sm text-text-cool">
              {filtered.length} produit{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <label htmlFor="sort" className="text-text-cool">Trier par :</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="Affichage en liste"
                  aria-pressed={viewMode === "list"}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-text-cool hover:bg-surface"}`}
                >
                  <List size={16} aria-hidden="true" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Affichage en grille"
                  aria-pressed={viewMode === "grid"}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-text-cool hover:bg-surface"}`}
                >
                  <LayoutGrid size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto p-6">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search size={40} className="text-text-cool mb-3" />
                <p className="text-sm font-medium text-text-cool">Aucun produit trouvé</p>
                <p className="text-xs text-text-cool mt-1">Modifiez vos filtres</p>
              </div>
            ) : viewMode === "list" ? (
              <div className="flex flex-col gap-4">
                {filtered.map((p) => {
                  const Icon = typeIcons[p.product_type] ?? DEFAULT_TYPE_ICON;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-5 p-5 rounded-xl border border-border bg-white hover:border-primary/30 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt="" className="h-full w-full object-contain" loading="lazy" />
                        ) : (
                          <Icon size={28} className="text-text-cool" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold">{p.name}</h3>
                          {p.scraped_url && (
                            <a href={p.scraped_url} target="_blank" rel="noopener noreferrer" className="text-text-cool hover:text-primary" aria-label={`Fiche source de ${p.name}`}>
                              <ExternalLink size={14} aria-hidden="true" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-text-cool mt-0.5">{getSpecs(p)}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {typeLabels[p.product_type] ?? p.product_type}
                          </span>
                          <span className="text-xs text-text-cool">{p.manufacturer}</span>
                          {getTags(p).map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-0.5 rounded-full bg-accent text-xs font-medium text-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 pl-4 border-l border-border">
                        <PriceTag p={p} compact />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((p) => {
                  const Icon = typeIcons[p.product_type] ?? DEFAULT_TYPE_ICON;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col p-5 rounded-xl border border-border bg-white hover:border-primary/30 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-lg bg-surface flex items-center justify-center mb-3 overflow-hidden">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt="" className="h-full w-full object-contain" loading="lazy" />
                        ) : (
                          <Icon size={24} className="text-text-cool" aria-hidden="true" />
                        )}
                      </div>
                      <h3 className="text-sm font-semibold">{p.name}</h3>
                      <p className="text-xs text-text-cool mt-1 line-clamp-1">{getSpecs(p)}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {typeLabels[p.product_type] ?? p.product_type}
                        </span>
                        <span className="text-xs text-text-cool">{p.manufacturer}</span>
                      </div>
                      <div className="mt-3">
                        <PriceTag p={p} />
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                        {getTags(p).slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs text-text-cool">{tag}</span>
                        ))}
                        {p.scraped_url && (
                          <a href={p.scraped_url} target="_blank" rel="noopener noreferrer" className="text-text-cool hover:text-primary" aria-label={`Fiche source de ${p.name}`}>
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
