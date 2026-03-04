import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-text-cool">
      <LayoutDashboard size={48} strokeWidth={1.5} />
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p>Overview of your infrastructure projects.</p>
    </div>
  );
}
