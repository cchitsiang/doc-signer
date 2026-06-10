import { describe, it, expect, beforeEach } from "vitest";
import { listSignatures, saveSignature, deleteSignature } from "@/lib/signature/storage";

describe("signature storage", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty", () => {
    expect(listSignatures()).toEqual([]);
  });

  it("saves and lists a signature", () => {
    const item = saveSignature("data:image/png;base64,AAA");
    const all = listSignatures();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(item.id);
    expect(all[0].dataUrl).toBe("data:image/png;base64,AAA");
  });

  it("deletes a signature", () => {
    const item = saveSignature("data:image/png;base64,BBB");
    deleteSignature(item.id);
    expect(listSignatures()).toEqual([]);
  });

  it("returns [] gracefully when stored value is corrupt", () => {
    localStorage.setItem("doc-signer:signatures", "not json");
    expect(listSignatures()).toEqual([]);
  });
});
