"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Star,
  List,
  LayoutGrid,
  Server,
  Monitor,
  Wifi,
  HardDrive,
  Check,
  ChevronRight,
} from "lucide-react";

// --- Product data ---
type ProductType = "server" | "workstation" | "network" | "storage";

interface Product {
  id: string;
  name: string;
  brand: string;
  type: ProductType;
  specs: string;
  price: number;
  rating: number;
  reviews: number;
  tags: string[];
}

const products: Product[] = [
  {
    id: "p1",
    name: "Dell PowerEdge R750",
    brand: "Dell",
    type: "server",
    specs: "Xeon Silver 4314, 32GB RAM, 2x 1TB SSD",
    price: 4599,
    rating: 4.7,
    reviews: 203,
    tags: ["E590", "Windows Server"],
  },
  {
    id: "p2",
    name: "Dell OptiPlex 7090 Tower",
    brand: "Dell",
    type: "workstation",
    specs: "Intel i7-11700, 16GB RAM, 512GB SSD",
    price: 1249,
    rating: 4.5,
    reviews: 128,
    tags: ["Windows 11", "Ubuntu"],
  },
  {
    id: "p3",
    name: "Ubiquiti UniFi Switch Pro 48",
    brand: "Ubiquiti",
    type: "network",
    specs: "48-Port PoE+, Layer 3, 600W",
    price: 1299,
    rating: 4.5,
    reviews: 321,
    tags: ["UniFi OS"],
  },
  {
    id: "p4",
    name: "Cisco Catalyst 9300-48P",
    brand: "Cisco",
    type: "network",
    specs: "48-Port PoE+, Layer 3, 740W",
    price: 8950,
    rating: 4.8,
    reviews: 156,
    tags: ["IOS XE"],
  },
  {
    id: "p5",
    name: "HP ProLiant DL380 Gen10",
    brand: "HP",
    type: "server",
    specs: "Xeon Gold 6230, 64GB RAM, 4x 2TB SSD",
    price: 7299,
    rating: 4.6,
    reviews: 189,
    tags: ["iLO 5", "Windows Server"],
  },
  {
    id: "p6",
    name: "Lenovo ThinkCentre M90q Gen3",
    brand: "Lenovo",
    type: "workstation",
    specs: "Intel i5-12500, 16GB RAM, 256GB SSD",
    price: 899,
    rating: 4.3,
    reviews: 87,
    tags: ["Windows 11"],
  },
  {
    id: "p7",
    name: "Aruba 2930F 48G PoE+",
    brand: "HP",
    type: "network",
    specs: "48-Port PoE+, Layer 3, 370W",
    price: 3200,
    rating: 4.4,
    reviews: 94,
    tags: ["ArubaOS"],
  },
  {
    id: "p8",
    name: "Synology RackStation RS1221+",
    brand: "Synology",
    type: "storage",
    specs: "8-Bay NAS, Ryzen V1500B, 4GB ECC RAM",
    price: 1350,
    rating: 4.6,
    reviews: 214,
    tags: ["DSM 7"],
  },
  {
    id: "p9",
    name: "HP EliteDesk 800 G8",
    brand: "HP",
    type: "workstation",
    specs: "Intel i7-11700, 32GB RAM, 512GB SSD",
    price: 1599,
    rating: 4.4,
    reviews: 112,
    tags: ["Windows 11", "Ubuntu"],
  },
  {
    id: "p10",
    name: "Dell PowerEdge T550",
    brand: "Dell",
    type: "server",
    specs: "Xeon Silver 4310, 16GB RAM, 2TB HDD",
    price: 3499,
    rating: 4.5,
    reviews: 67,
    tags: ["E590", "VMware"],
  },
];

const brands = ["Dell", "HP", "Cisco", "Lenovo", "Ubiquiti", "Synology"];
const types: { value: ProductType; label: string }[] = [
  { value: "workstation", label: "Workstation" },
  { value: "server", label: "Server" },
  { value: "network", label: "Network" },
  { value: "storage", label: "Storage" },
];

const typeIconMap: Record<ProductType, typeof Server> = {
  server: Server,
  workstation: Monitor,
  network: Wifi,
  storage: HardDrive,
};

const sortOptions = [
  { value: "popularity", label: "Popularity" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([]);
  const [priceRange, setPriceRange] = useState(10000);
  const [sortBy, setSortBy] = useState("popularity");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  const toggleType = (t: ProductType) =>
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const resetFilters = () => {
    setSelectedBrands([]);
    setSelectedTypes([]);
    setPriceRange(10000);
    setSearch("");
  };

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) return false;
      if (p.price > priceRange) return false;
      return true;
    });

    if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sortBy === "rating") list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => b.reviews - a.reviews);

    return list;
  }, [search, selectedBrands, selectedTypes, priceRange, sortBy]);

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="px-6 py-2 text-sm text-text-cool border-b border-border bg-white flex items-center gap-1.5">
        <span>Home</span>
        <ChevronRight size={12} />
        <span className="text-foreground font-medium">Marketplace</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar filters */}
        <aside className="w-56 shrink-0 border-r border-border bg-white p-5 overflow-y-auto">
          <h2 className="text-base font-semibold mb-5">Filters</h2>

          {/* Search */}
          <div className="mb-5">
            <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm">
              <Search size={14} className="text-text-cool shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>
          </div>

          {/* Brand */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold mb-2.5">Brand</h3>
            <div className="flex flex-col gap-2">
              {brands.map((b) => (
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
              {types.map((t) => (
                <label key={t.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(t.value)}
                    onChange={() => toggleType(t.value)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold mb-2.5">Price Range</h3>
            <p className="text-xs text-text-cool mb-2">$0 - ${priceRange.toLocaleString()}</p>
            <input
              type="range"
              min={0}
              max={10000}
              step={100}
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <button
            onClick={resetFilters}
            className="w-full py-2.5 text-sm border border-border rounded-lg hover:bg-surface transition-colors"
          >
            Reset Filters
          </button>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-white">
            <span className="text-sm text-text-cool">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-cool">Sort by:</span>
                <select
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
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-text-cool hover:bg-surface"}`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-text-cool hover:bg-surface"}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto p-6">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search size={40} className="text-text-cool mb-3" />
                <p className="text-sm font-medium text-text-cool">No products found</p>
                <p className="text-xs text-text-cool mt-1">Try adjusting your filters</p>
              </div>
            ) : viewMode === "list" ? (
              <div className="flex flex-col gap-4">
                {filtered.map((p) => {
                  const Icon = typeIconMap[p.type];
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-5 p-5 rounded-xl border border-border bg-white hover:border-primary/30 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center shrink-0">
                        <Icon size={28} className="text-text-cool" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold">{p.name}</h3>
                        <p className="text-sm text-text-cool mt-0.5">{p.specs}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-sm">
                            <Star size={14} className="text-accent fill-accent" />
                            <span className="font-medium">{p.rating}</span>
                            <span className="text-text-cool">({p.reviews})</span>
                          </span>
                          {p.tags.map((tag) => (
                            <span
                              key={tag}
                              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent text-xs font-medium text-foreground"
                            >
                              <Check size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-2xl font-bold">${p.price.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((p) => {
                  const Icon = typeIconMap[p.type];
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col p-5 rounded-xl border border-border bg-white hover:border-primary/30 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-lg bg-surface flex items-center justify-center mb-3">
                        <Icon size={24} className="text-text-cool" />
                      </div>
                      <h3 className="text-sm font-semibold">{p.name}</h3>
                      <p className="text-xs text-text-cool mt-1 line-clamp-1">{p.specs}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Star size={12} className="text-accent fill-accent" />
                        <span className="text-xs font-medium">{p.rating}</span>
                        <span className="text-xs text-text-cool">({p.reviews})</span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border">
                        <span className="text-lg font-bold">${p.price.toLocaleString()}</span>
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
