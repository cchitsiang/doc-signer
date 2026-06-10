import { useEffect, useRef, useState } from "react";
import type { LoadedPdf } from "@/lib/pdf/loader";
import type { PageGeometry, ScreenRect } from "@/lib/pdf/coordinates";
import type { Annotation } from "@/state/annotations";
import { PlacedAnnotation } from "@/components/PlacedAnnotation";

interface Props {
  pdf: LoadedPdf;
  pageNumber: number; // 1-based
  scale: number;
  annotations: Annotation[];
  onGeometry: (pageIndex: number, geom: PageGeometry) => void;
  onPlace: (pageIndex: number, at: { x: number; y: number }) => void;
  onChangeRect: (id: string, rect: ScreenRect) => void;
  onRemove: (id: string) => void;
}

export function PdfPage({
  pdf,
  pageNumber,
  scale,
  annotations,
  onGeometry,
  onPlace,
  onChangeRect,
  onRemove,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const pageIndex = pageNumber - 1;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const canvas = await pdf.renderPage(pageNumber, scale);
      if (cancelled || !hostRef.current) return;
      hostRef.current.querySelector("canvas")?.remove();
      hostRef.current.prepend(canvas);
      setSize({ w: canvas.width, h: canvas.height });
      const { width, height } = await pdf.getPageSize(pageNumber);
      onGeometry(pageIndex, { pdfWidth: width, pdfHeight: height, scale });
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, scale, pageIndex, onGeometry]);

  function handleClick(e: React.MouseEvent) {
    if (e.target !== e.currentTarget && (e.target as Element).tagName !== "CANVAS") return;
    const host = hostRef.current;
    if (!host) return;
    const r = host.getBoundingClientRect();
    onPlace(pageIndex, { x: e.clientX - r.left, y: e.clientY - r.top });
  }

  return (
    <div
      ref={hostRef}
      onClick={handleClick}
      className="relative mx-auto my-4 shadow-sm bg-card"
      style={{ width: size.w || undefined, height: size.h || undefined }}
    >
      {annotations.map((a) => (
        <PlacedAnnotation
          key={a.id}
          annotation={a}
          onChange={(rect) => onChangeRect(a.id, rect)}
          onRemove={() => onRemove(a.id)}
        />
      ))}
    </div>
  );
}
