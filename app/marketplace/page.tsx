import { Store } from "lucide-react";

export default function MarketplacePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-text-cool">
      <Store size={48} strokeWidth={1.5} />
      <h1 className="text-2xl font-semibold text-foreground">Marketplace</h1>
      <p>Browse and install pre-built infrastructure templates.</p>
    </div>
  );
}
