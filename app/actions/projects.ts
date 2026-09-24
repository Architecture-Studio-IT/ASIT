"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { CanvasNode, Connection } from "@/app/designer/designer-data";

export type ProjectSummary = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  deviceCount: number;
  connectionCount: number;
  /** Somme des prix relevés par l'utilisateur, en euros HT. */
  quotedBudget: number;
  /** Nombre d'équipements ayant un prix relevé. */
  pricedCount: number;
};

export type ProjectData = {
  id: string;
  name: string;
  nodes: CanvasNode[];
  connections: Connection[];
  notes: Record<string, string>;
};

const nodeSchema = z.object({
  id: z.string().max(64),
  type: z.string().min(1).max(40),
  label: z.string().max(200),
  x: z.number().finite(),
  y: z.number().finite(),
  productId: z.number().int().positive().optional(),
  price: z.number().finite().nonnegative().max(1e9).optional(),
  priceNote: z.string().max(120).optional(),
});

const connectionSchema = z.object({
  from: z.string().max(64),
  to: z.string().max(64),
  waypoints: z.array(z.object({ x: z.number().finite(), y: z.number().finite() })).max(50).optional(),
});

const saveSchema = z.object({
  nodes: z.array(nodeSchema).max(2000),
  connections: z.array(connectionSchema).max(5000),
  notes: z.record(z.string().max(64), z.string().max(5000)),
});

const nameSchema = z.string().trim().min(1).max(80);

export async function listProjects(): Promise<ProjectSummary[]> {
  const user = await requireUser();
  const rows = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true, nodes: true, connections: true },
  });
  return rows.map((p) => {
    const nodes = Array.isArray(p.nodes) ? (p.nodes as unknown as CanvasNode[]) : [];
    const connections = Array.isArray(p.connections) ? (p.connections as unknown as Connection[]) : [];
    return {
      id: p.id,
      name: p.name,
      createdAt: p.createdAt.getTime(),
      updatedAt: p.updatedAt.getTime(),
      deviceCount: nodes.length,
      connectionCount: connections.length,
      quotedBudget: nodes.reduce((sum, n) => sum + (n.price ?? 0), 0),
      pricedCount: nodes.filter((n) => n.price != null).length,
    };
  });
}

export async function getProject(id: string): Promise<ProjectData | null> {
  const user = await requireUser();
  const p = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    nodes: (p.nodes as unknown as CanvasNode[]) ?? [],
    connections: (p.connections as unknown as Connection[]) ?? [],
    notes: (p.notes as unknown as Record<string, string>) ?? {},
  };
}

/**
 * Appelée aussi pendant le rendu de /designer (création du premier projet) :
 * pas de revalidatePath ici, interdit pendant un rendu. Les pages concernées
 * sont dynamiques et relisent la base à chaque requête.
 */
export async function createProject(name?: string): Promise<ProjectSummary> {
  const user = await requireUser();
  const count = await prisma.project.count({ where: { userId: user.id } });
  const p = await prisma.project.create({
    data: { userId: user.id, name: nameSchema.parse(name ?? `Projet ${count + 1}`) },
  });
  return {
    id: p.id,
    name: p.name,
    createdAt: p.createdAt.getTime(),
    updatedAt: p.updatedAt.getTime(),
    deviceCount: 0,
    connectionCount: 0,
    quotedBudget: 0,
    pricedCount: 0,
  };
}

export async function renameProject(id: string, name: string): Promise<void> {
  const user = await requireUser();
  await prisma.project.updateMany({
    where: { id, userId: user.id },
    data: { name: nameSchema.parse(name) },
  });
  revalidatePath("/dashboard");
}

export async function deleteProject(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.project.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard");
}

/** Sauvegarde complète du contenu d'un projet. Appelée avec un délai côté client. */
export async function saveProject(
  id: string,
  payload: { nodes: CanvasNode[]; connections: Connection[]; notes: Record<string, string> },
): Promise<void> {
  const user = await requireUser();
  const data = saveSchema.parse(payload);
  await prisma.project.updateMany({
    where: { id, userId: user.id },
    data: { nodes: data.nodes, connections: data.connections, notes: data.notes },
  });
}
