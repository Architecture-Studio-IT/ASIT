"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Zap, Monitor, Clock, Cpu, Pencil, Plus, Server, Globe, Building2 } from "lucide-react";
import { createProject, renameProject, type ProjectSummary } from "../actions/projects";

const projectIcons = [FolderOpen, Globe, Building2, Server];
const projectIconColors = ["bg-primary/10 text-primary", "bg-accent/10 text-accent", "bg-warning/10 text-warning", "bg-primary/10 text-primary"];

const euro = (n: number) => `${n.toLocaleString("fr-FR")} €`;

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? "s" : ""}`;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof FolderOpen }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-white px-5 py-4">
      <div>
        <p className="text-sm text-text-cool">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
        <Icon size={20} className="text-primary" />
      </div>
    </div>
  );
}

export default function DashboardClient({ projects: initial }: { projects: ProjectSummary[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [creating, setCreating] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingId]);

  const commitRename = async () => {
    const name = editValue.trim();
    if (editingId && name) {
      setProjects((prev) => prev.map((p) => (p.id === editingId ? { ...p, name } : p)));
      await renameProject(editingId, name);
    }
    setEditingId(null);
  };

  const handleCreate = async () => {
    setCreating(true);
    const p = await createProject();
    router.push(`/designer?project=${p.id}`);
  };

  const totalDevices = projects.reduce((sum, p) => sum + p.deviceCount, 0);
  const totalConnections = projects.reduce((sum, p) => sum + p.connectionCount, 0);
  const totalBudget = projects.reduce((sum, p) => sum + p.quotedBudget, 0);
  const totalPriced = projects.reduce((sum, p) => sum + p.pricedCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <h1 className="sr-only">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Projets" value={projects.length} icon={FolderOpen} />
        <StatCard label="Liaisons" value={totalConnections} icon={Zap} />
        <StatCard label={`Budget relevé (${totalPriced}/${totalDevices} chiffrés)`} value={euro(totalBudget)} icon={Cpu} />
        <StatCard label="Équipements" value={totalDevices} icon={Monitor} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-labelledby="recents" className="lg:col-span-2 rounded-xl border border-border bg-white p-5">
          <h2 id="recents" className="text-lg font-semibold mb-4">
            Projets récents
          </h2>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen size={40} className="text-text-cool mb-3" aria-hidden="true" />
              <p className="text-sm text-text-cool">Aucun projet pour l&apos;instant.</p>
              <p className="text-xs text-text-cool mt-1">Créez votre premier projet pour commencer.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {projects.map((p, i) => {
                const Icon = projectIcons[i % projectIcons.length];
                const colorClass = projectIconColors[i % projectIconColors.length];
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-surface transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`} aria-hidden="true">
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === p.id ? (
                        <input
                          ref={renameInputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          aria-label="Nouveau nom du projet"
                          className="text-sm font-medium bg-transparent outline-none border-b border-primary w-full"
                        />
                      ) : (
                        <Link href={`/designer?project=${p.id}`} className="text-sm font-medium truncate block hover:text-primary">
                          {p.name}
                        </Link>
                      )}
                      <p className="text-xs text-text-cool flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock size={11} aria-hidden="true" />
                          modifié {timeAgo(p.updatedAt)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Cpu size={11} aria-hidden="true" />
                          {p.deviceCount} équipement{p.deviceCount !== 1 ? "s" : ""}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setEditValue(p.name);
                      }}
                      className="p-2 rounded-lg hover:bg-primary/10 text-text-cool hover:text-primary transition-colors"
                      aria-label={`Renommer ${p.name}`}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-5">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
            >
              <Plus size={16} aria-hidden="true" />
              {creating ? "Création…" : "Nouveau projet"}
            </button>
          </div>
        </section>

        <section aria-labelledby="activite" className="rounded-xl border border-border bg-white p-5">
          <h2 id="activite" className="text-lg font-semibold mb-4">
            Activité récente
          </h2>
          {projects.length === 0 ? (
            <p className="text-sm text-text-cool">Aucune activité.</p>
          ) : (
            <ul className="flex flex-col gap-5">
              {projects.slice(0, 5).map((p, i) => {
                const dotColors = ["bg-accent", "bg-primary", "bg-warning", "bg-accent", "bg-text-cool"];
                return (
                  <li key={p.id} className="flex gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotColors[i % dotColors.length]}`} aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium">
                        {p.deviceCount} équipement{p.deviceCount !== 1 ? "s" : ""}, {p.connectionCount} liaison
                        {p.connectionCount !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-text-cool">{p.name}</p>
                      <p className="text-xs text-text-cool">{timeAgo(p.updatedAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
