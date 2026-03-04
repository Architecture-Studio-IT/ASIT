import { useState } from "react";
import { Shape, Circle, Group } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import type { Waypoint } from "./designer-data";
import { ACCENT_COLOR, WAYPOINT_RADIUS, SELECTED_COLOR } from "./constants";

// --- Draw connection path: straight lines with waypoints, bezier without ---
export function drawConnectionPath(
  ctx: { moveTo: (x: number, y: number) => void; lineTo: (x: number, y: number) => void; bezierCurveTo: (cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) => void },
  fx: number, fy: number,
  tx: number, ty: number,
  waypoints: Waypoint[],
) {
  ctx.moveTo(fx, fy);

  if (waypoints.length === 0) {
    const dy = Math.abs(ty - fy);
    const offset = Math.max(50, dy * 0.5);
    ctx.bezierCurveTo(fx, fy + offset, tx, ty - offset, tx, ty);
  } else {
    for (const wp of waypoints) {
      ctx.lineTo(wp.x, wp.y);
    }
    ctx.lineTo(tx, ty);
  }
}

// --- Preview connection (drag in progress) ---
export function ConnectionPreview({
  fromX,
  fromY,
  toX,
  toY,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}) {
  return (
    <Shape
      sceneFunc={(ctx, shape) => {
        ctx.beginPath();
        drawConnectionPath(ctx, fromX, fromY, toX, toY, []);
        ctx.fillStrokeShape(shape);
      }}
      stroke={ACCENT_COLOR}
      strokeWidth={2.5}
      opacity={0.4}
      hitStrokeWidth={0}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
}

// --- WaypointHandle: draggable circle on a connection ---
export function WaypointHandle({
  wp,
  connKey,
  wpIndex,
  selected,
  onDrag,
  onDragEnd,
  onRemove,
}: {
  wp: Waypoint;
  connKey: string;
  wpIndex: number;
  selected: boolean;
  onDrag: (connKey: string, wpIndex: number, x: number, y: number) => void;
  onDragEnd: () => void;
  onRemove: (connKey: string, wpIndex: number) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Circle
      x={wp.x}
      y={wp.y}
      radius={hovered ? WAYPOINT_RADIUS + 2 : WAYPOINT_RADIUS}
      fill={selected ? SELECTED_COLOR : hovered ? ACCENT_COLOR : "white"}
      stroke={selected ? SELECTED_COLOR : ACCENT_COLOR}
      strokeWidth={2}
      draggable
      onMouseEnter={(e: KonvaEventObject<MouseEvent>) => {
        setHovered(true);
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "grab";
      }}
      onMouseLeave={(e: KonvaEventObject<MouseEvent>) => {
        setHovered(false);
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "default";
      }}
      onDragMove={(e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        onDrag(connKey, wpIndex, e.target.x(), e.target.y());
      }}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        onDragEnd();
      }}
      onDblClick={(e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        onRemove(connKey, wpIndex);
      }}
      onContextMenu={(e: KonvaEventObject<PointerEvent>) => {
        e.evt.preventDefault();
        e.cancelBubble = true;
        onRemove(connKey, wpIndex);
      }}
      perfectDrawEnabled={false}
    />
  );
}

// --- BezierConnection: full connection line with waypoint support ---
export function BezierConnection({
  connKey,
  fromX,
  fromY,
  toX,
  toY,
  waypoints,
  selected,
  shapeRefs,
  onClick,
  onDblClick,
  onContextMenu,
}: {
  connKey: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  waypoints: Waypoint[];
  selected: boolean;
  shapeRefs: React.RefObject<Map<string, Konva.Shape>>;
  onClick: (key: string) => void;
  onDblClick: (key: string, x: number, y: number, segmentIndex: number) => void;
  onContextMenu: (key: string, e: KonvaEventObject<PointerEvent>) => void;
}) {
  return (
    <Shape
      ref={(ref) => {
        if (ref) {
          ref.setAttr("_fromX", fromX);
          ref.setAttr("_fromY", fromY);
          ref.setAttr("_toX", toX);
          ref.setAttr("_toY", toY);
          ref.setAttr("_waypoints", waypoints);
          shapeRefs.current!.set(connKey, ref);
        } else {
          shapeRefs.current!.delete(connKey);
        }
      }}
      sceneFunc={(ctx, shape) => {
        const fx = shape.getAttr("_fromX") ?? fromX;
        const fy = shape.getAttr("_fromY") ?? fromY;
        const tx = shape.getAttr("_toX") ?? toX;
        const ty = shape.getAttr("_toY") ?? toY;
        const wps: Waypoint[] = shape.getAttr("_waypoints") ?? waypoints;

        ctx.beginPath();
        drawConnectionPath(ctx, fx, fy, tx, ty, wps);
        ctx.fillStrokeShape(shape);
      }}
      stroke={selected ? SELECTED_COLOR : ACCENT_COLOR}
      strokeWidth={selected ? 3 : 2.5}
      opacity={selected ? 0.9 : 0.6}
      hitStrokeWidth={15}
      perfectDrawEnabled={false}
      onClick={() => onClick(connKey)}
      onTap={() => onClick(connKey)}
      onDblClick={(e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        const stage = e.target.getStage();
        if (!stage) return;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const s = stage.scaleX();
        const x = pointer.x / s;
        const y = pointer.y / s;

        const allPoints = [
          { x: fromX, y: fromY },
          ...waypoints,
          { x: toX, y: toY },
        ];
        let bestSegment = 0;
        let bestDist = Infinity;
        for (let i = 0; i < allPoints.length - 1; i++) {
          const mx = (allPoints[i].x + allPoints[i + 1].x) / 2;
          const my = (allPoints[i].y + allPoints[i + 1].y) / 2;
          const d = (x - mx) ** 2 + (y - my) ** 2;
          if (d < bestDist) {
            bestDist = d;
            bestSegment = i;
          }
        }

        onDblClick(connKey, x, y, bestSegment);
      }}
      onContextMenu={(e: KonvaEventObject<PointerEvent>) => onContextMenu(connKey, e)}
    />
  );
}

// --- ConnectionGroup: renders a connection + its waypoint handles ---
export function ConnectionGroup({
  connKey,
  fromX,
  fromY,
  toX,
  toY,
  waypoints,
  selected,
  shapeRefs,
  onConnectionClick,
  onConnectionDblClick,
  onConnectionContextMenu,
  onWaypointDrag,
  onWaypointDragEnd,
  onWaypointRemove,
}: {
  connKey: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  waypoints: Waypoint[];
  selected: boolean;
  shapeRefs: React.RefObject<Map<string, Konva.Shape>>;
  onConnectionClick: (key: string) => void;
  onConnectionDblClick: (key: string, x: number, y: number, segmentIndex: number) => void;
  onConnectionContextMenu: (key: string, e: KonvaEventObject<PointerEvent>) => void;
  onWaypointDrag: (connKey: string, wpIndex: number, x: number, y: number) => void;
  onWaypointDragEnd: () => void;
  onWaypointRemove: (connKey: string, wpIndex: number) => void;
}) {
  return (
    <Group>
      <BezierConnection
        connKey={connKey}
        fromX={fromX}
        fromY={fromY}
        toX={toX}
        toY={toY}
        waypoints={waypoints}
        selected={selected}
        shapeRefs={shapeRefs}
        onClick={onConnectionClick}
        onDblClick={onConnectionDblClick}
        onContextMenu={onConnectionContextMenu}
      />
      {waypoints.map((wp, i) => (
        <WaypointHandle
          key={`${connKey}-wp-${i}`}
          wp={wp}
          connKey={connKey}
          wpIndex={i}
          selected={selected}
          onDrag={onWaypointDrag}
          onDragEnd={onWaypointDragEnd}
          onRemove={onWaypointRemove}
        />
      ))}
    </Group>
  );
}
