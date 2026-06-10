import { describe, it, expect, vi, beforeEach } from "vitest";
import { canShareFiles, makePdfFile } from "@/lib/share/output";

describe("output helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("makePdfFile wraps bytes in a File with the right type and name", () => {
    const file = makePdfFile(new Uint8Array([1, 2, 3]), "signed.pdf");
    expect(file.name).toBe("signed.pdf");
    expect(file.type).toBe("application/pdf");
  });

  it("canShareFiles is false when navigator.canShare is absent", () => {
    // jsdom has no navigator.canShare by default
    expect(canShareFiles(makePdfFile(new Uint8Array([1]), "x.pdf"))).toBe(false);
  });
});
