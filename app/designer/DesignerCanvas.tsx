"use client";

import { useState, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { initialNodes, initialConnections, type NodeType } from "./designer-data";
import { NODE_W, NODE_H } from "./constants";
import { useCanvasNodes } from "./useCanvasNodes";
import { useConnections } from "./useConnections";
import { ConnectionGroup, ConnectionPreview } from "./ConnectionLine";
import NodeShape from "./NodeShape";
import ZoomControls, { useCanvasViewport } from "./ZoomControls";

export default function DesignerCanvas() {
  const { nodes, commitNodePosition, addNode } = useCanvasNodes(initialNodes);
  const conn = useConnections(initialConnections);
  const viewport = useCanvasViewport();

  const [dragOver, setDragOver] = useState(false);

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
      }
    },
    [conn.deselectConnection],
  );

  // Drop from sidebar
  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/equipment")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDragOver(true);
    }
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const raw = e.dataTransfer.getData("application/equipment");
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
              isConnecting={!!conn.draggingFrom}
              draggingFromId={conn.draggingFrom}
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
