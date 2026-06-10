export interface PageGeometry {
  /** Unscaled page width in PDF points. */
  pdfWidth: number;
  /** Unscaled page height in PDF points. */
  pdfHeight: number;
  /** pdf.js viewport scale used to render the page to canvas. */
  scale: number;
}

/** A rectangle in rendered screen pixels, relative to the page's top-left. */
export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A rectangle in PDF points, origin bottom-left (pdf-lib convention). */
export interface PdfRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function screenRectToPdfRect(rect: ScreenRect, geom: PageGeometry): PdfRect {
  const { scale, pdfHeight } = geom;
  const width = rect.width / scale;
  const height = rect.height / scale;
  const x = rect.x / scale;
  // Flip the y-axis: screen top-left -> PDF bottom-left.
  const y = pdfHeight - (rect.y + rect.height) / scale;
  return { x, y, width, height };
}

/** Convert a screen-pixel length (e.g. font size) to PDF points. */
export function screenLengthToPdf(lengthPx: number, geom: PageGeometry): number {
  return lengthPx / geom.scale;
}
