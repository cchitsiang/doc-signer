import type { LoadedPdf } from "@/lib/pdf/loader";
import type { PageGeometry, ScreenRect } from "@/lib/pdf/coordinates";
import type { Annotation } from "@/state/annotations";
import { PdfPage } from "@/components/PdfPage";

interface Props {
  pdf: LoadedPdf;
  scale: number;
  annotations: Annotation[];
  onGeometry: (pageIndex: number, geom: PageGeometry) => void;
  onPlace: (pageIndex: number, at: { x: number; y: number }) => void;
  onChangeRect: (id: string, rect: ScreenRect) => void;
  onRemove: (id: string) => void;
}

export function Viewer({ pdf, scale, annotations, ...handlers }: Props) {
  const pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
  return (
    <div className="w-full overflow-auto pb-32">
      {pages.map((p) => (
        <PdfPage
          key={p}
          pdf={pdf}
          pageNumber={p}
          scale={scale}
          annotations={annotations.filter((a) => a.pageIndex === p - 1)}
          {...handlers}
        />
      ))}
    </div>
  );
}
