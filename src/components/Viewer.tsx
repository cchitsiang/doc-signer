import { useEffect, useRef, useState } from "react";
import type { LoadedPdf } from "@/lib/pdf/loader";
import type { PageGeometry, ScreenRect } from "@/lib/pdf/coordinates";
import type { Annotation } from "@/state/annotations";
import { PdfPage } from "@/components/PdfPage";
import { ZoomIn, ZoomOut } from "lucide-react";

interface Props {
  pdf: LoadedPdf;
  scale: number;
  annotations: Annotation[];
  onGeometry: (pageIndex: number, geom: PageGeometry) => void;
  onPlace: (pageIndex: number, at: { x: number; y: number }) => void;
  onChangeRect: (id: string, rect: ScreenRect) => void;
  onRemove: (id: string) => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

export function Viewer({ pdf, scale, annotations, ...handlers }: Props) {
  const pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;

  // Reset zoom when a different document loads.
  useEffect(() => {
    setZoom(1);
  }, [pdf]);

  // Two-finger pinch to zoom. Uses a non-passive touch listener so the gesture
  // can preventDefault and not fight native scrolling.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startDist = 0;
    let startZoom = 1;
    const dist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        startDist = dist(e.touches);
        startZoom = zoomRef.current;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDist > 0) {
        e.preventDefault();
        setZoom(clamp((startZoom * dist(e.touches)) / startDist));
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) startDist = 0;
    };

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  return (
    <div ref={scrollRef} className="relative w-full overflow-auto pb-32">
      {pages.map((p) => (
        <PdfPage
          key={p}
          pdf={pdf}
          pageNumber={p}
          scale={scale}
          zoom={zoom}
          annotations={annotations.filter((a) => a.pageIndex === p - 1)}
          {...handlers}
        />
      ))}

      <div className="fixed bottom-24 right-4 z-10 flex flex-col items-center gap-1 rounded-full border border-border bg-card/90 p-1 shadow-md backdrop-blur">
        <button
          className="hover:text-primary flex size-8 items-center justify-center rounded-full"
          onClick={() => setZoom((z) => clamp(z + 0.25))}
          aria-label="Zoom in"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          className="text-muted-foreground w-9 text-center text-[10px] tabular-nums"
          onClick={() => setZoom(1)}
          aria-label="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          className="hover:text-primary flex size-8 items-center justify-center rounded-full"
          onClick={() => setZoom((z) => clamp(z - 0.25))}
          aria-label="Zoom out"
        >
          <ZoomOut className="size-4" />
        </button>
      </div>
    </div>
  );
}
