import { describe, it, expect } from "vitest";
import { annotationsReducer, initialAnnotationsState, type Annotation } from "@/state/annotations";

const sig: Annotation = {
  id: "a1",
  type: "signature",
  pageIndex: 0,
  rect: { x: 10, y: 10, width: 100, height: 40 },
  payload: { dataUrl: "data:image/png;base64,XXX" },
};

describe("annotationsReducer", () => {
  it("adds an annotation", () => {
    const s = annotationsReducer(initialAnnotationsState, { type: "add", annotation: sig });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].id).toBe("a1");
  });

  it("updates an annotation's rect (move/resize)", () => {
    const added = annotationsReducer(initialAnnotationsState, { type: "add", annotation: sig });
    const moved = annotationsReducer(added, {
      type: "update",
      id: "a1",
      patch: { rect: { x: 50, y: 60, width: 120, height: 50 } },
    });
    expect(moved.items[0].rect).toEqual({ x: 50, y: 60, width: 120, height: 50 });
  });

  it("removes an annotation", () => {
    const added = annotationsReducer(initialAnnotationsState, { type: "add", annotation: sig });
    const removed = annotationsReducer(added, { type: "remove", id: "a1" });
    expect(removed.items).toHaveLength(0);
  });

  it("clears all annotations", () => {
    const added = annotationsReducer(initialAnnotationsState, { type: "add", annotation: sig });
    const cleared = annotationsReducer(added, { type: "clear" });
    expect(cleared.items).toHaveLength(0);
  });
});
