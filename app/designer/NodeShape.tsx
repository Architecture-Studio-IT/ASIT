import { useState, useRef, useCallback } from "react";
import { Rect, Text, Line, Group, Circle } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import type { CanvasNode } from "./designer-data";
import { NODE_W, NODE_H, NODE_PADDING, PORT_RADIUS, ACCENT_COLOR, typeColors } from "./constants";

// --- Port: circular connection point ---
function Port({
  x,
  y,
  type,
  nodeId,
  isConnecting,
  compatibleTarget,
  onOutputMouseDown,
  onInputMouseUp,
}: {
  x: number;
  y: number;
  type: "input" | "output";
  nodeId: string;
  isConnecting: boolean;
  compatibleTarget: boolean;
  onOutputMouseDown: (nodeId: string) => void;
  onInputMouseUp: (nodeId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const glowing = isConnecting && compatibleTarget && type === "input";
  const fillColor = hovered || glowing ? ACCENT_COLOR : "white";
  const radius = glowing ? PORT_RADIUS + 3 : hovered ? PORT_RADIUS + 1 : PORT_RADIUS;

  return (
    <Circle
      x={x}
      y={y}
      radius={radius}
      fill={fillColor}
      stroke={ACCENT_COLOR}
      strokeWidth={2}
      onMouseEnter={(e: KonvaEventObject<MouseEvent>) => {
        setHovered(true);
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "crosshair";
      }}
      onMouseLeave={(e: KonvaEventObject<MouseEvent>) => {
        setHovered(false);
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "default";
      }}
      onMouseDown={(e: KonvaEventObject<MouseEvent>) => {
        if (type === "output") {
          e.cancelBubble = true;
          onOutputMouseDown(nodeId);
        }
      }}
      onMouseUp={(e: KonvaEventObject<MouseEvent>) => {
        if (type === "input") {
          e.cancelBubble = true;
          onInputMouseUp(nodeId);
        }
      }}
      perfectDrawEnabled={false}
    />
  );
}

// --- Device icons ---
function DeviceIcon({ type, x, y }: { type: string; x: number; y: number }) {
  const cx = x + NODE_W / 2;
  const cy = y + 45;

  if (type === "server") {
    return (
      <Group listening={false}>
        <Rect x={cx - 16} y={cy - 18} width={32} height={12} fill="#42EB90" cornerRadius={2} />
        <Rect x={cx - 16} y={cy - 3} width={32} height={12} fill="#42EB90" cornerRadius={2} />
        <Rect x={cx - 16} y={cy + 12} width={32} height={12} fill="#42EB90" cornerRadius={2} />
      </Group>
    );
  }

  if (type === "switch") {
    return (
      <Group listening={false}>
        <Rect x={cx - 16} y={cy - 10} width={32} height={24} fill="#0D7A8A" cornerRadius={4} />
        <Line points={[cx - 8, cy + 2, cx, cy - 4, cx + 8, cy + 2]} stroke="white" strokeWidth={2} />
        <Line points={[cx - 4, cy + 6, cx, cy + 2, cx + 4, cy + 6]} stroke="white" strokeWidth={2} />
      </Group>
    );
  }

  return (
    <Group listening={false}>
      <Rect x={cx - 14} y={cy - 12} width={28} height={20} fill="#0D7A8A" cornerRadius={2} />
      <Rect x={cx - 6} y={cy + 10} width={12} height={3} fill="#0D7A8A" cornerRadius={1} />
      <Line points={[cx, cy + 8, cx, cy + 10]} stroke="#0D7A8A" strokeWidth={2} />
    </Group>
  );
}

// --- NodeShape: equipment node with ports ---
export default function NodeShape({
  node,
  otherNodes,
  isConnecting,
  draggingFromId,
  onDragMove,
  onDragEnd,
  onOutputMouseDown,
  onInputMouseUp,
}: {
  node: CanvasNode;
  otherNodes: CanvasNode[];
  isConnecting: boolean;
  draggingFromId: string | null;
  onDragMove: (id: string, group: Konva.Group) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onOutputMouseDown: (nodeId: string) => void;
  onInputMouseUp: (nodeId: string) => void;
}) {
  const colors = typeColors[node.type];
  const compatibleTarget = isConnecting && draggingFromId !== node.id;

  const otherNodesRef = useRef(otherNodes);
  otherNodesRef.current = otherNodes;

  const dragBoundFunc = useCallback(
    (pos: { x: number; y: number }) => {
      const others = otherNodesRef.current;
      let { x, y } = pos;

      x = Math.max(0, x);
      y = Math.max(0, y);

      for (const other of others) {
        const overlapX = x < other.x + NODE_W + NODE_PADDING && x + NODE_W + NODE_PADDING > other.x;
        const overlapY = y < other.y + NODE_H + NODE_PADDING && y + NODE_H + NODE_PADDING > other.y;

        if (overlapX && overlapY) {
          const pushRight = other.x + NODE_W + NODE_PADDING - x;
          const pushLeft = x + NODE_W + NODE_PADDING - other.x;
          const pushDown = other.y + NODE_H + NODE_PADDING - y;
          const pushUp = y + NODE_H + NODE_PADDING - other.y;

          const minPush = Math.min(pushRight, pushLeft, pushDown, pushUp);

          if (minPush === pushRight) x = other.x + NODE_W + NODE_PADDING;
          else if (minPush === pushLeft) x = other.x - NODE_W - NODE_PADDING;
          else if (minPush === pushDown) y = other.y + NODE_H + NODE_PADDING;
          else y = other.y - NODE_H - NODE_PADDING;
        }
      }

      return { x: Math.max(0, x), y: Math.max(0, y) };
    },
    [],
  );

  return (
    <Group
      id={node.id}
      x={node.x}
      y={node.y}
      draggable
      dragBoundFunc={dragBoundFunc}
      onDragMove={(e: KonvaEventObject<DragEvent>) => {
        onDragMove(node.id, e.target as unknown as Konva.Group);
      }}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        onDragEnd(node.id, e.target.x(), e.target.y());
      }}
    >
      <Rect
        width={NODE_W}
        height={NODE_H}
        fill="white"
        stroke={colors.stroke}
        strokeWidth={2}
        cornerRadius={8}
        shadowColor="rgba(0,0,0,0.08)"
        shadowBlur={4}
        shadowOffsetY={1}
        shadowForStrokeEnabled={false}
        perfectDrawEnabled={false}
      />
      <DeviceIcon type={node.type} x={0} y={0} />
      <Text
        text={node.label}
        x={0}
        y={NODE_H - 40}
        width={NODE_W}
        align="center"
        fontSize={13}
        fontFamily="sans-serif"
        fill="#1a1a2e"
        lineHeight={1.3}
        listening={false}
      />
      <Port
        x={NODE_W / 2}
        y={0}
        type="input"
        nodeId={node.id}
        isConnecting={isConnecting}
        compatibleTarget={compatibleTarget}
        onOutputMouseDown={onOutputMouseDown}
        onInputMouseUp={onInputMouseUp}
      />
      <Port
        x={NODE_W / 2}
        y={NODE_H}
        type="output"
        nodeId={node.id}
        isConnecting={isConnecting}
        compatibleTarget={false}
        onOutputMouseDown={onOutputMouseDown}
        onInputMouseUp={onInputMouseUp}
      />
    </Group>
  );
}
