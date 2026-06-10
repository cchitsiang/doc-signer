import { useRef } from "react";
import type { Annotation } from "@/state/annotations";
import type { ScreenRect } from "@/lib/pdf/coordinates";
import { X } from "lucide-react";

interface Props {
  annotation: Annotation;
  zoom: number;
  onChange: (rect: ScreenRect) => void;
  onRemove: () => void;
}

export function PlacedAnnotation({ annotation, zoom, onChange, onRemove }: Props) {
  const start = useRef<{ px: number; py: number; rect: ScreenRect } | null>(null);
  const mode = useRef<"move" | "resize" | null>(null);
  const { rect } = annotation;

  function onPointerDown(e: React.PointerEvent, m: "move" | "resize") {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, rect: { ...rect } };
    mode.current = m;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current || !mode.current) return;
    // Deltas are in zoomed CSS px; convert to the page's unscaled space.
    const dx = (e.clientX - start.current.px) / zoom;
    const dy = (e.clientY - start.current.py) / zoom;
    const s = start.current.rect;
    if (mode.current === "move") {
      onChange({ ...s, x: s.x + dx, y: s.y + dy });
    } else {
      onChange({
        ...s,
        width: Math.max(24, s.width + dx),
        height: Math.max(16, s.height + dy),
      });
    }
  }

  function onPointerUp() {
    start.current = null;
    mode.current = null;
  }

  return (
    <div
      className="absolute border-2 border-primary/70 bg-primary/5 touch-none"
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      onPointerDown={(e) => onPointerDown(e, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {annotation.type === "signature" ? (
        <img
          src={annotation.payload.dataUrl}
          alt="signature"
          className="w-full h-full object-contain pointer-events-none"
        />
      ) : (
        <span
          className="block w-full h-full pointer-events-none leading-none"
          style={{ fontSize: annotation.payload.fontSizePx, color: annotation.payload.color }}
        >
          {annotation.payload.text}
        </span>
      )}

      <button
        className="absolute -top-3 -right-3 rounded-full bg-primary text-primary-foreground p-0.5"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        aria-label="Remove"
      >
        <X size={14} />
      </button>

      <span
        className="absolute -bottom-2 -right-2 h-4 w-4 rounded-sm bg-primary cursor-se-resize"
        onPointerDown={(e) => onPointerDown(e, "resize")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  );
}
