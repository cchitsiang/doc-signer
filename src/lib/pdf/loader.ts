import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface LoadedPdf {
  numPages: number;
  /** Render a 1-based page to a canvas at the given scale. */
  renderPage: (pageNumber: number, scale: number) => Promise<HTMLCanvasElement>;
  /** Unscaled page size in PDF points. */
  getPageSize: (pageNumber: number) => Promise<{ width: number; height: number }>;
}

export async function loadPdf(bytes: ArrayBuffer | Uint8Array): Promise<LoadedPdf> {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const doc = await pdfjsLib.getDocument({ data }).promise;

  return {
    numPages: doc.numPages,
    async getPageSize(pageNumber: number) {
      const page = await doc.getPage(pageNumber);
      const vp = page.getViewport({ scale: 1 });
      return { width: vp.width, height: vp.height };
    },
    async renderPage(pageNumber: number, scale: number) {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2d canvas context");
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      return canvas;
    },
  };
}

/** Throws if the bytes are not a parseable PDF. */
export async function isValidPdf(bytes: ArrayBuffer | Uint8Array): Promise<boolean> {
  try {
    await loadPdf(bytes);
    return true;
  } catch {
    return false;
  }
}
