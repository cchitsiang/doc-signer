import { describe, it, expect, vi, afterEach } from "vitest";
import { readPdfUrlParam, fetchPdfFromUrl, readUploadIdUrl } from "@/lib/pwa/remotePdf";

afterEach(() => {
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
});

describe("readPdfUrlParam", () => {
  it("returns null when no url is present", () => {
    window.history.replaceState({}, "", "/");
    expect(readPdfUrlParam()).toBeNull();
  });

  it("reads an http(s) url from the ?url= query param", () => {
    window.history.replaceState({}, "", "/?url=https://example.com/a.pdf");
    expect(readPdfUrlParam()).toBe("https://example.com/a.pdf");
  });

  it("reads a percent-encoded url from the #url= fragment", () => {
    const target = "https://example.com/path/doc.pdf?token=abc";
    window.history.replaceState({}, "", "/#url=" + encodeURIComponent(target));
    expect(readPdfUrlParam()).toBe(target);
  });

  it("rejects non-http(s) schemes", () => {
    window.history.replaceState({}, "", "/?url=" + encodeURIComponent("javascript:alert(1)"));
    expect(readPdfUrlParam()).toBeNull();
  });
});

describe("readUploadIdUrl", () => {
  it("returns null when no id is present", () => {
    window.history.replaceState({}, "", "/");
    expect(readUploadIdUrl()).toBeNull();
  });

  it("builds a same-origin /api/pdf url from a valid id", () => {
    window.history.replaceState({}, "", "/?id=abc123def4567890");
    expect(readUploadIdUrl()).toBe(window.location.origin + "/api/pdf?id=abc123def4567890");
  });

  it("rejects a malformed id", () => {
    window.history.replaceState({}, "", "/?id=../etc/passwd");
    expect(readUploadIdUrl()).toBeNull();
  });
});

describe("fetchPdfFromUrl", () => {
  it("returns the response bytes on success", async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, arrayBuffer: async () => bytes })),
    );
    const out = await fetchPdfFromUrl("https://example.com/a.pdf");
    expect(new Uint8Array(out)).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("throws on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) })),
    );
    await expect(fetchPdfFromUrl("https://example.com/missing.pdf")).rejects.toThrow();
  });
});
