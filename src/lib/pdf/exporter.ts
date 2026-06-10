import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Annotation } from "@/state/annotations";
import { screenRectToPdfRect, screenLengthToPdf, type PageGeometry } from "@/lib/pdf/coordinates";

function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  return rgb(Number.isFinite(r) ? r : 0, Number.isFinite(g) ? g : 0, Number.isFinite(b) ? b : 0);
}

/**
 * Bake annotations into the original PDF bytes.
 * @param geometries per-page geometry, indexed by pageIndex.
 */
export async function exportPdf(
  originalBytes: ArrayBuffer | Uint8Array,
  annotations: Annotation[],
  geometries: PageGeometry[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(originalBytes);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const ann of annotations) {
    const page = pages[ann.pageIndex];
    const geom = geometries[ann.pageIndex];
    if (!page || !geom) continue;
    const r = screenRectToPdfRect(ann.rect, geom);

    if (ann.type === "signature") {
      const png = await doc.embedPng(ann.payload.dataUrl);
      page.drawImage(png, { x: r.x, y: r.y, width: r.width, height: r.height });
    } else {
      const size = screenLengthToPdf(ann.payload.fontSizePx, geom);
      // pdf-lib text y is the baseline; nudge up from the rect bottom.
      page.drawText(ann.payload.text, {
        x: r.x,
        y: r.y + (r.height - size) / 2,
        size,
        font,
        color: hexToRgb(ann.payload.color),
      });
    }
  }

  return doc.save();
}
