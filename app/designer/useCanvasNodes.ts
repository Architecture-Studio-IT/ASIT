import { useState, useCallback } from "react";
import type { CanvasNode, NodeType } from "./designer-data";
import { NODE_W, NODE_H, NODE_PADDING, GRID_SIZE } from "./constants";

function snap(v: number) {
  return Math.round(v / GRID_SIZE) * GRID_SIZE;
}

function resolveOverlap(
  x: number,
  y: number,
  nodeId: string,
  allNodes: CanvasNode[],
): { x: number; y: number } {
  const others = allNodes.filter((n) => n.id !== nodeId);
  let nx = x;
  let ny = y;

  for (let i = 0; i < 20; i++) {
    let overlapping = false;
    for (const other of others) {
      const overlapX = nx < other.x + NODE_W + NODE_PADDING && nx + NODE_W + NODE_PADDING > other.x;
      const overlapY = ny < other.y + NODE_H + NODE_PADDING && ny + NODE_H + NODE_PADDING > other.y;

      if (overlapX && overlapY) {
        overlapping = true;
        const pushRight = other.x + NODE_W + NODE_PADDING - nx;
        const pushLeft = nx + NODE_W + NODE_PADDING - other.x;
        const pushDown = other.y + NODE_H + NODE_PADDING - ny;
        const pushUp = ny + NODE_H + NODE_PADDING - other.y;

        const minPush = Math.min(pushRight, pushLeft, pushDown, pushUp);
        if (minPush === pushRight) nx = other.x + NODE_W + NODE_PADDING;
        else if (minPush === pushLeft) nx = other.x - NODE_W - NODE_PADDING;
        else if (minPush === pushDown) ny = other.y + NODE_H + NODE_PADDING;
        else ny = other.y - NODE_H - NODE_PADDING;
      }
    }
    if (!overlapping) break;
  }

  return { x: nx, y: ny };
}

function getMaxId(nodes: CanvasNode[]): number {
  return nodes.reduce((max, n) => {
    const num = parseInt(n.id.replace("node-", ""), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
}

/**
 * État des nœuds d'un projet. L'état initial vient de la base ; la persistance
 * est assurée par le parent, qui observe `nodes` et appelle saveProject.
 */
export function useCanvasNodes(initial: CanvasNode[]) {
  const [nodes, setNodes] = useState<CanvasNode[]>(initial);
  const [nextId, setNextId] = useState(() => getMaxId(initial) + 1);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const selectNode = useCallback((id: string | null, shiftKey?: boolean) => {
    if (!id) {
      setSelectedNodes([]);
      return;
    }
    if (shiftKey) {
      setSelectedNodes((prev) =>
        prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id],
      );
    } else {
      setSelectedNodes([id]);
    }
  }, []);

  const deleteSelectedNodes = useCallback(() => {
    setSelectedNodes((sel) => {
      setNodes((prev) => prev.filter((n) => !sel.includes(n.id)));
      return [];
    });
  }, []);

  const commitNodePosition = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) => {
      const resolved = resolveOverlap(snap(x), snap(y), id, prev);
      return prev.map((n) => (n.id === id ? { ...n, ...resolved } : n));
    });
  }, []);

  const addNode = useCallback(
    (name: string, type: NodeType, x: number, y: number, productId?: number) => {
      const newId = `node-${nextId}`;
      setNextId((n) => n + 1);
      setNodes((prev) => {
        const resolved = resolveOverlap(snap(x), snap(y), newId, prev);
        return [...prev, { id: newId, type, label: name, productId, ...resolved }];
      });
    },
    [nextId],
  );

  /** Mise à jour partielle d'un nœud (prix relevé, note…), depuis l'inspecteur. */
  const updateNode = useCallback((id: string, patch: Partial<Omit<CanvasNode, "id">>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  return { nodes, selectedNodes, selectNode, deleteSelectedNodes, commitNodePosition, addNode, updateNode };
}
