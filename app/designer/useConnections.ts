import { useState, useCallback, useEffect, useRef } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import type { Connection, Waypoint } from "./designer-data";
import { NODE_W, NODE_H } from "./constants";

export function useConnections(initial: Connection[]) {
  const [connections, setConnections] = useState<Connection[]>(initial);
  const [draggingFrom, setDraggingFrom] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<{ x: number; y: number } | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const shapeRefs = useRef<Map<string, Konva.Shape>>(new Map());

  // Keyboard: delete selected connection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedConnection) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        const [from, to] = selectedConnection.split("->>");
        setConnections((prev) => prev.filter((c) => !(c.from === from && c.to === to)));
        setSelectedConnection(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedConnection]);

  // Start dragging from output port
  const startConnectionDrag = useCallback((nodeId: string) => {
    setDraggingFrom(nodeId);
    setSelectedConnection(null);
  }, []);

  // Complete connection on input port
  const completeConnection = useCallback(
    (targetNodeId: string) => {
      if (!draggingFrom) return;
      if (draggingFrom === targetNodeId) {
        setDraggingFrom(null);
        setDragTarget(null);
        return;
      }

      setConnections((prev) => {
        const exists = prev.some((c) => c.from === draggingFrom && c.to === targetNodeId);
        if (exists) return prev;
        return [...prev, { from: draggingFrom, to: targetNodeId }];
      });

      setDraggingFrom(null);
      setDragTarget(null);
    },
    [draggingFrom],
  );

  // Update cursor position during drag
  const updateDragTarget = useCallback(
    (e: KonvaEventObject<MouseEvent>, scale: number, stagePos: { x: number; y: number }) => {
      if (!draggingFrom) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      // Convert screen coords to canvas coords (account for pan + scale)
      setDragTarget({
        x: (pointer.x - stagePos.x) / scale,
        y: (pointer.y - stagePos.y) / scale,
      });
    },
    [draggingFrom],
  );

  // Cancel drag on mouse up in empty space
  const cancelDrag = useCallback(() => {
    if (draggingFrom) {
      setDraggingFrom(null);
      setDragTarget(null);
    }
  }, [draggingFrom]);

  // Deselect on empty canvas click
  const deselectConnection = useCallback(() => {
    setSelectedConnection(null);
  }, []);

  // Toggle selection on connection click
  const handleConnectionClick = useCallback((connKey: string) => {
    setSelectedConnection((prev) => (prev === connKey ? null : connKey));
  }, []);

  // Right-click delete
  const handleConnectionContextMenu = useCallback(
    (connKey: string, e: KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      const [from, to] = connKey.split("->>");
      setConnections((prev) => prev.filter((c) => !(c.from === from && c.to === to)));
      setSelectedConnection(null);
    },
    [],
  );

  // Imperative update during node drag
  const updateConnectionShapes = useCallback(
    (nodeId: string, x: number, y: number) => {
      connections.forEach((conn) => {
        const key = `${conn.from}->>${conn.to}`;
        const shape = shapeRefs.current.get(key);
        if (!shape) return;

        if (conn.from === nodeId || conn.to === nodeId) {
          shape.setAttr("_fromX", conn.from === nodeId ? x + NODE_W / 2 : shape.getAttr("_fromX"));
          shape.setAttr("_fromY", conn.from === nodeId ? y + NODE_H : shape.getAttr("_fromY"));
          shape.setAttr("_toX", conn.to === nodeId ? x + NODE_W / 2 : shape.getAttr("_toX"));
          shape.setAttr("_toY", conn.to === nodeId ? y : shape.getAttr("_toY"));
          shape.getLayer()?.batchDraw();
        }
      });
    },
    [connections],
  );

  // --- Waypoint handlers ---
  const addWaypoint = useCallback(
    (connKey: string, x: number, y: number, segmentIndex: number) => {
      const [from, to] = connKey.split("->>");
      setConnections((prev) =>
        prev.map((c) => {
          if (c.from !== from || c.to !== to) return c;
          const wps = [...(c.waypoints ?? [])];
          wps.splice(segmentIndex, 0, { x, y });
          return { ...c, waypoints: wps };
        }),
      );
      setSelectedConnection(connKey);
    },
    [],
  );

  const moveWaypoint = useCallback(
    (connKey: string, wpIndex: number, x: number, y: number) => {
      const [from, to] = connKey.split("->>");
      setConnections((prev) =>
        prev.map((c) => {
          if (c.from !== from || c.to !== to) return c;
          const wps = [...(c.waypoints ?? [])];
          wps[wpIndex] = { x, y };
          return { ...c, waypoints: wps };
        }),
      );
    },
    [],
  );

  const onWaypointDragEnd = useCallback(() => {}, []);

  const removeWaypoint = useCallback(
    (connKey: string, wpIndex: number) => {
      const [from, to] = connKey.split("->>");
      setConnections((prev) =>
        prev.map((c) => {
          if (c.from !== from || c.to !== to) return c;
          const wps = [...(c.waypoints ?? [])];
          wps.splice(wpIndex, 1);
          return { ...c, waypoints: wps.length > 0 ? wps : undefined };
        }),
      );
    },
    [],
  );

  return {
    connections,
    draggingFrom,
    dragTarget,
    selectedConnection,
    shapeRefs,
    startConnectionDrag,
    completeConnection,
    updateDragTarget,
    cancelDrag,
    deselectConnection,
    handleConnectionClick,
    handleConnectionContextMenu,
    updateConnectionShapes,
    addWaypoint,
    moveWaypoint,
    onWaypointDragEnd,
    removeWaypoint,
  };
}
