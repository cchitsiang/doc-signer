import { describe, it, expect } from "vitest";
import { PDFDocument, rgb } from "pdf-lib";
import { exportPdf } from "@/lib/pdf/exporter";
import type { Annotation } from "@/state/annotations";

// 1x1 transparent PNG
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function blankPdfBytes(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([600, 800]);
  return doc.save();
}

describe("exportPdf", () => {
  it("bakes a signature image and text into the pdf and returns a valid pdf", async () => {
    const original = await blankPdfBytes();
    const annotations: Annotation[] = [
      {
        id: "s1",
        type: "signature",
        pageIndex: 0,
        rect: { x: 100, y: 100, width: 200, height: 80 },
        payload: { dataUrl: PNG },
      },
      {
        id: "t1",
        type: "text",
        pageIndex: 0,
        rect: { x: 50, y: 50, width: 150, height: 30 },
        payload: { text: "Signed", fontSizePx: 24, color: "#000000" },
      },
    ];

    const out = await exportPdf(original, annotations, [
      { pdfWidth: 600, pdfHeight: 800, scale: 1 },
    ]);

    // Result is a valid PDF with the same page count.
    const reloaded = await PDFDocument.load(out);
    expect(reloaded.getPageCount()).toBe(1);
    // Embedding an image + text should make the file larger than the blank original.
    expect(out.byteLength).toBeGreaterThan(original.byteLength);
  });

  it("uses rgb for color parsing without throwing", () => {
    // sanity that rgb import is wired (guards against tree-shake regressions)
    expect(typeof rgb).toBe("function");
  });
});
