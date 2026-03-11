"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Zap,
  Monitor,
  Clock,
  Cpu,
  Pencil,
  LayoutGrid,
  Plus,
  FileText,
  Upload,
  Server,
  Globe,
  Building2,
} from "lucide-react";
import { STORAGE_KEYS, typePrices } from "../designer/constants";
import type { Project } from "../designer/useProjects";
import type { CanvasNode, Connection } from "../designer/designer-data";

interface ProjectStats {
  project: Project;
  deviceCount: number;
  connectionCount: number;
  estimatedBudget: number;
}

const projectIcons = [FolderOpen, Globe, Building2, Server];
const projectIconColors = ["bg-primary/10 text-primary", "bg-accent/10 text-accent", "bg-warning/10 text-warning", "bg-primary/10 text-primary"];

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof FolderOpen;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-white px-5 py-4">
      <div>
        <p className="text-sm text-text-cool">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={20} className="text-primary" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!raw) return;
      const projects: Project[] = JSON.parse(raw);

      const stats = projects.map((project) => {
        let deviceCount = 0;
        let connectionCount = 0;
        let estimatedBudget = 0;
        try {
          const nodesRaw = localStorage.getItem(STORAGE_KEYS.NODES(project.id));
          if (nodesRaw) {
            const nodes: CanvasNode[] = JSON.parse(nodesRaw);
            deviceCount = nodes.length;
            estimatedBudget = nodes.reduce((sum, n) => sum + (typePrices[n.type] || 0), 0);
          }
          const connsRaw = localStorage.getItem(STORAGE_KEYS.CONNECTIONS(project.id));
          if (connsRaw) {
            const conns: Connection[] = JSON.parse(connsRaw);
            connectionCount = conns.length;
            estimatedBudget += conns.length * 150;
          }
        } catch {}
        return { project, deviceCount, connectionCount, estimatedBudget };
      });

      // Sort by most recently created first
      stats.sort((a, b) => b.project.createdAt - a.project.createdAt);
      setProjectStats(stats);
    } catch {}
  }, []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingId]);

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      // Update in localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (raw) {
          const projects: Project[] = JSON.parse(raw);
          const updated = projects.map((p) =>
            p.id === editingId ? { ...p, name: editValue.trim() } : p,
          );
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
          setProjectStats((prev) =>
            prev.map((s) =>
              s.project.id === editingId
                ? { ...s, project: { ...s.project, name: editValue.trim() } }
                : s,
            ),
          );
        }
      } catch {}
    }
    setEditingId(null);
  };

  const totalProjects = projectStats.length;
  const totalDevices = projectStats.reduce((sum, s) => sum + s.deviceCount, 0);
  const totalConnections = projectStats.reduce((sum, s) => sum + s.connectionCount, 0);
  const totalBudget = projectStats.reduce((sum, s) => sum + s.estimatedBudget, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={totalProjects} icon={FolderOpen} />
        <StatCard label="Active Designs" value={totalProjects} icon={Zap} />
        <StatCard label="Estimated Budget" value={`$${totalBudget.toLocaleString()}`} icon={Cpu} />
        <StatCard label="Devices Count" value={totalDevices} icon={Monitor} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold mb-4">Recent Projects</h2>

          {projectStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen size={40} className="text-text-cool mb-3" />
              <p className="text-sm text-text-cool">No projects yet.</p>
              <p className="text-xs text-text-cool mt-1">Go to the Designer to create your first project.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {projectStats.map((s, i) => {
                const Icon = projectIcons[i % projectIcons.length];
                const colorClass = projectIconColors[i % projectIconColors.length];
                return (
                  <div
                    key={s.project.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-surface transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === s.project.id ? (
                        <input
                          ref={renameInputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="text-sm font-medium bg-transparent outline-none border-b border-primary w-full"
                        />
                      ) : (
                        <p
                          className="text-sm font-medium truncate cursor-pointer"
                          onDoubleClick={() => {
                            setEditingId(s.project.id);
                            setEditValue(s.project.name);
                          }}
                          title="Double-click to rename"
                        >
                          {s.project.name}
                        </p>
                      )}
                      <p className="text-xs text-text-cool flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {timeAgo(s.project.createdAt)}
                        </span>
                        <span>-</span>
                        <span className="flex items-center gap-1">
                          <Cpu size={11} />
                          {s.deviceCount} device{s.deviceCount !== 1 ? "s" : ""}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, s.project.id);
                          router.push("/designer");
                        }}
                        className="p-2 rounded-lg hover:bg-primary/10 text-text-cool hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, s.project.id);
                          router.push("/designer");
                        }}
                        className="p-2 rounded-lg hover:bg-primary/10 text-text-cool hover:text-primary transition-colors"
                        title="Preview"
                      >
                        <LayoutGrid size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <Link
              href="/designer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <Plus size={16} />
              New Project
            </Link>
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-sm font-medium hover:bg-surface transition-colors">
              <FileText size={16} />
              Browse Templates
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-sm font-medium hover:bg-surface transition-colors">
              <Upload size={16} />
              Import Design
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

          {projectStats.length === 0 ? (
            <p className="text-sm text-text-cool">No activity yet.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {projectStats.slice(0, 5).map((s, i) => {
                const dotColors = ["bg-accent", "bg-primary", "bg-warning", "bg-accent", "bg-text-cool"];
                const actions = [
                  `Created project with ${s.deviceCount} device${s.deviceCount !== 1 ? "s" : ""}`,
                  `${s.connectionCount} connection${s.connectionCount !== 1 ? "s" : ""} configured`,
                ];
                return (
                  <div key={s.project.id} className="flex gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotColors[i % dotColors.length]}`} />
                    <div>
                      <p className="text-sm font-medium">{actions[i % actions.length]}</p>
                      <p className="text-xs text-text-cool">{s.project.name}</p>
                      <p className="text-xs text-text-cool">{timeAgo(s.project.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
