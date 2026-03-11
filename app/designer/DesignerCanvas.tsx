"use client";

import { useState, useCallback, useEffect } from "react";
import { Stage, Layer, Shape } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { initialNodes, initialConnections, type NodeType, type CanvasNode, type Connection } from "./designer-data";
import { NODE_W, NODE_H, GRID_SIZE, EQUIPMENT_MIME_TYPE } from "./constants";
import { useCanvasNodes } from "./useCanvasNodes";
import { useConnections } from "./useConnections";
import { ConnectionGroup, ConnectionPreview } from "./ConnectionLine";
import NodeShape from "./NodeShape";
import ZoomControls, { useCanvasViewport } from "./ZoomControls";

// --- Grid dots background ---
function CanvasGrid({
  scale,
  stagePos,
  stageSize,
}: {
  scale: number;
  stagePos: { x: number; y: number };
  stageSize: { width: number; height: number };
}) {
  // Adaptive step: ensure dots are ≥15px apart on screen
  let step = GRID_SIZE;
  while (step * scale < 15) step *= 2;

  const left = Math.floor(-stagePos.x / scale / step) * step;
  const top = Math.floor(-stagePos.y / scale / step) * step;
  const right = left + stageSize.width / scale + step;
  const bottom = top + stageSize.height / scale + step;
  const dotRadius = 1.5 / scale;

  return (
    <Shape
      sceneFunc={(ctx, shape) => {
        ctx.beginPath();
        for (let x = left; x <= right; x += step) {
          for (let y = top; y <= bottom; y += step) {
            ctx.moveTo(x + dotRadius, y);
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          }
        }
        ctx.fillStrokeShape(shape);
      }}
      fill="#D1D5DB"
      listening={false}
      perfectDrawEnabled={false}
    />
  );
}

export default function DesignerCanvas({
  onSelectionChange,
  onNodesChange,
  onConnectionsChange,
}: {
  onSelectionChange?: (nodes: CanvasNode[]) => void;
  onNodesChange?: (nodes: CanvasNode[]) => void;
  onConnectionsChange?: (connections: Connection[]) => void;
}) {
  const { nodes, selectedNodes, selectNode, deleteSelectedNodes, commitNodePosition, addNode } =
    useCanvasNodes(initialNodes);

  // Report state changes to parent
  useEffect(() => {
    onSelectionChange?.(nodes.filter((n) => selectedNodes.includes(n.id)));
  }, [selectedNodes, nodes, onSelectionChange]);

  useEffect(() => {
    onNodesChange?.(nodes);
  }, [nodes, onNodesChange]);

  const conn = useConnections(initialConnections);

  useEffect(() => {
    onConnectionsChange?.(conn.connections);
  }, [conn.connections, onConnectionsChange]);

  const viewport = useCanvasViewport();

  const [dragOver, setDragOver] = useState(false);

  // Keyboard: delete selected nodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodes.length > 0) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        selectedNodes.forEach((id) => conn.removeNodeConnections(id));
        deleteSelectedNodes();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodes, deleteSelectedNodes, conn.removeNodeConnections]);

  // Node drag → update connection shapes imperatively
  const handleNodeDragMove = useCallback(
    (id: string, group: Konva.Group) => {
      conn.updateConnectionShapes(id, group.x(), group.y());
    },
    [conn.updateConnectionShapes],
  );

  const handleStageMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => conn.updateDragTarget(e, viewport.scale, viewport.stagePos),
    [conn.updateDragTarget, viewport.scale, viewport.stagePos],
  );

  const handleStageMouseUp = useCallback(() => conn.cancelDrag(), [conn.cancelDrag]);

  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        conn.deselectConnection();
        selectNode(null);
      }
    },
    [conn.deselectConnection, selectNode],
  );

  // Drop from sidebar
  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(EQUIPMENT_MIME_TYPE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDragOver(true);
    }
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const raw = e.dataTransfer.getData(EQUIPMENT_MIME_TYPE);
    if (!raw) return;

    const { name, type } = JSON.parse(raw) as { name: string; type: NodeType };
    const containerRect = viewport.containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const x = (e.clientX - containerRect.left - viewport.stagePos.x) / viewport.scale - NODE_W / 2;
    const y = (e.clientY - containerRect.top - viewport.stagePos.y) / viewport.scale - NODE_H / 2;
    addNode(name, type, x, y);
  };

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div
      ref={viewport.containerRef}
      className={`relative flex-1 overflow-hidden transition-colors ${
        dragOver ? "bg-primary/5" : "bg-surface"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="px-6 py-3 bg-primary/10 border-2 border-dashed border-primary rounded-xl text-primary font-medium">
            Drop to add equipment
          </div>
        </div>
      )}

      <Stage
        ref={viewport.stageRef}
        width={viewport.stageSize.width}
        height={viewport.stageSize.height}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        x={viewport.stagePos.x}
        y={viewport.stagePos.y}
        draggable
        onDragEnd={viewport.handleStageDragEnd}
        onWheel={viewport.handleWheel}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onClick={handleStageClick}
      >
        <Layer>
          <CanvasGrid scale={viewport.scale} stagePos={viewport.stagePos} stageSize={viewport.stageSize} />

          {conn.connections.map((c) => {
            const from = nodeMap[c.from];
            const to = nodeMap[c.to];
            if (!from || !to) return null;
            const key = `${c.from}->>${c.to}`;

            return (
              <ConnectionGroup
                key={key}
                connKey={key}
                fromX={from.x + NODE_W / 2}
                fromY={from.y + NODE_H}
                toX={to.x + NODE_W / 2}
                toY={to.y}
                waypoints={c.waypoints ?? []}
                selected={conn.selectedConnection === key}
                shapeRefs={conn.shapeRefs}
                onConnectionClick={conn.handleConnectionClick}
                onConnectionDblClick={conn.addWaypoint}
                onConnectionContextMenu={conn.handleConnectionContextMenu}
                onWaypointDrag={conn.moveWaypoint}
                onWaypointDragEnd={conn.onWaypointDragEnd}
                onWaypointRemove={conn.removeWaypoint}
              />
            );
          })}

          {conn.draggingFrom && conn.dragTarget && nodeMap[conn.draggingFrom] && (
            <ConnectionPreview
              fromX={nodeMap[conn.draggingFrom].x + NODE_W / 2}
              fromY={nodeMap[conn.draggingFrom].y + NODE_H}
              toX={conn.dragTarget.x}
              toY={conn.dragTarget.y}
            />
          )}

          {nodes.map((node) => (
            <NodeShape
              key={node.id}
              node={node}
              otherNodes={nodes.filter((n) => n.id !== node.id)}
              selected={selectedNodes.includes(node.id)}
              isConnecting={!!conn.draggingFrom}
              draggingFromId={conn.draggingFrom}
              onSelect={selectNode}
              onDragMove={handleNodeDragMove}
              onDragEnd={commitNodePosition}
              onOutputMouseDown={conn.startConnectionDrag}
              onInputMouseUp={conn.completeConnection}
            />
          ))}
        </Layer>
      </Stage>

      <ZoomControls onZoomIn={viewport.handleZoomIn} onZoomOut={viewport.handleZoomOut} />
    </div>
  );
}
