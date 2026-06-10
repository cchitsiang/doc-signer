import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";

export interface SignatureCanvasHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

interface Props {
  className?: string;
  /** Stroke color. Defaults to a near-black ink. */
  penColor?: string;
}

/**
 * Canvas signature pad with unified mouse / touch / stylus support via Pointer
 * Events. The backing store is sized to the element's displayed box × devicePixelRatio,
 * so pointer coordinates map 1:1 and strokes stay crisp. Background is transparent
 * so the exported PNG overlays a PDF cleanly.
 */
export const SignatureCanvas = forwardRef<SignatureCanvasHandle, Props>(function SignatureCanvas(
  { className, penColor = "#1a1a1a" },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const dirty = useRef(false);

  function applyStrokeStyle(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = penColor;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Setting width/height resets the transform — re-apply the dpr scale.
        ctx.scale(dpr, dpr);
        applyStrokeStyle(ctx);
      }
      dirty.current = false;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
    // penColor is stable per dialog open; intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const l = last.current;
    if (!ctx || !l) return;
    const p = point(e);
    const midX = (l.x + p.x) / 2;
    const midY = (l.y + p.y) / 2;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y);
    ctx.quadraticCurveTo(l.x, l.y, midX, midY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    dirty.current = true;
  }

  function onPointerUp() {
    drawing.current = false;
    last.current = null;
  }

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        dirty.current = false;
      },
      isEmpty: () => !dirty.current,
      toDataURL: () => canvasRef.current?.toDataURL("image/png") ?? "",
    }),
    [],
  );

  return (
    <canvas
      ref={canvasRef}
      className={cn("touch-none select-none", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
});
