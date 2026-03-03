import { useState, useCallback } from "react";
import type { CanvasNode, NodeType } from "./designer-data";
import { NODE_W, NODE_H, NODE_PADDING } from "./constants";

export function resolveOverlap(
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

  return { x: Math.max(0, nx), y: Math.max(0, ny) };
}

let nextId = 0;

export function useCanvasNodes(initial: CanvasNode[]) {
  const [nodes, setNodes] = useState<CanvasNode[]>(() => {
    nextId = initial.length + 1;
    return initial;
  });

  const commitNodePosition = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) => {
      const resolved = resolveOverlap(x, y, id, prev);
      return prev.map((n) => (n.id === id ? { ...n, ...resolved } : n));
    });
  }, []);

  const addNode = useCallback((name: string, type: NodeType, x: number, y: number) => {
    const newId = `node-${nextId++}`;
    setNodes((prev) => {
      const resolved = resolveOverlap(Math.max(0, x), Math.max(0, y), newId, prev);
      return [...prev, { id: newId, type, label: name, ...resolved }];
    });
  }, []);

  return { nodes, commitNodePosition, addNode };
}
