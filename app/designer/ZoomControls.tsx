import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as StageType } from "konva/lib/Stage";

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_SPEED = 1.1;

export function useCanvasViewport() {
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const stageRef = useRef<StageType>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stageSize, setStageSize] = useState({ width: 800, height: 700 });
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, direction > 0 ? oldScale * ZOOM_SPEED : oldScale / ZOOM_SPEED));

    setScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((s) => {
      const newScale = Math.min(MAX_SCALE, s * ZOOM_SPEED);
      const cx = stageSize.width / 2;
      const cy = stageSize.height / 2;
      const ptX = (cx - stagePos.x) / s;
      const ptY = (cy - stagePos.y) / s;
      setStagePos({ x: cx - ptX * newScale, y: cy - ptY * newScale });
      return newScale;
    });
  }, [stagePos, stageSize]);

  const handleZoomOut = useCallback(() => {
    setScale((s) => {
      const newScale = Math.max(MIN_SCALE, s / ZOOM_SPEED);
      const cx = stageSize.width / 2;
      const cy = stageSize.height / 2;
      const ptX = (cx - stagePos.x) / s;
      const ptY = (cy - stagePos.y) / s;
      setStagePos({ x: cx - ptX * newScale, y: cy - ptY * newScale });
      return newScale;
    });
  }, [stagePos, stageSize]);

  const handleStageDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (e.target === e.target.getStage()) {
      setStagePos({ x: e.target.x(), y: e.target.y() });
    }
  }, []);

  return {
    scale,
    stagePos,
    stageSize,
    stageRef,
    containerRef,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    handleStageDragEnd,
  };
}

export default function ZoomControls({ onZoomIn, onZoomOut }: { onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col border border-border rounded-lg overflow-hidden bg-white shadow-sm">
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-surface transition-colors"
      >
        <ZoomIn size={18} className="text-text-cool" />
      </button>
      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-surface transition-colors border-t border-border"
      >
        <ZoomOut size={18} className="text-text-cool" />
      </button>
    </div>
  );
}
