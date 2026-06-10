import { describe, it, expect } from "vitest";
import { screenRectToPdfRect, type PageGeometry, type ScreenRect } from "@/lib/pdf/coordinates";

const geom: PageGeometry = {
  pdfWidth: 600,
  pdfHeight: 800,
  scale: 2, // rendered canvas is 1200 x 1600 screen px
};

describe("screenRectToPdfRect", () => {
  it("converts a top-left screen rect to bottom-left PDF coords", () => {
    // 100x50 screen px box at screen (200, 100)
    const rect: ScreenRect = { x: 200, y: 100, width: 100, height: 50 };
    const pdf = screenRectToPdfRect(rect, geom);
    // x: 200 / scale = 100
    expect(pdf.x).toBeCloseTo(100, 5);
    // width: 100 / 2 = 50, height: 50 / 2 = 25
    expect(pdf.width).toBeCloseTo(50, 5);
    expect(pdf.height).toBeCloseTo(25, 5);
    // y (bottom-left): pdfHeight - (screenY + screenHeight)/scale
    //   = 800 - (100 + 50)/2 = 800 - 75 = 725
    expect(pdf.y).toBeCloseTo(725, 5);
  });

  it("places a box at the very top-left of the page near the page top", () => {
    const rect: ScreenRect = { x: 0, y: 0, width: 20, height: 20 };
    const pdf = screenRectToPdfRect(rect, geom);
    expect(pdf.x).toBeCloseTo(0, 5);
    // y = 800 - (0 + 20)/2 = 790
    expect(pdf.y).toBeCloseTo(790, 5);
  });
});

import { screenLengthToPdf } from "@/lib/pdf/coordinates";

describe("screenLengthToPdf", () => {
  it("scales a pixel length down to PDF points", () => {
    expect(screenLengthToPdf(32, geom)).toBeCloseTo(16, 5);
  });
});
