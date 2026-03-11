import { useState, useCallback, useEffect } from "react";
import type { CanvasNode, NodeType } from "./designer-data";
import { NODE_W, NODE_H, NODE_PADDING, GRID_SIZE, STORAGE_KEYS } from "./constants";

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

let nextId = 0;

export function useCanvasNodes(initial: CanvasNode[], projectId: string) {
  const storageKey = STORAGE_KEYS.NODES(projectId);

  const [nodes, setNodes] = useState<CanvasNode[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: CanvasNode[] = JSON.parse(saved);
        nextId = getMaxId(parsed) + 1;
        return parsed;
      }
    } catch {}
    nextId = getMaxId(initial) + 1;
    return initial;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(nodes));
  }, [nodes, storageKey]);

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

  const addNode = useCallback((name: string, type: NodeType, x: number, y: number) => {
    const newId = `node-${nextId++}`;
    setNodes((prev) => {
      const resolved = resolveOverlap(snap(x), snap(y), newId, prev);
      return [...prev, { id: newId, type, label: name, ...resolved }];
    });
  }, []);

  return { nodes, selectedNodes, selectNode, deleteSelectedNodes, commitNodePosition, addNode };
}
