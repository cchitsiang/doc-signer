import { describe, it, expect, afterEach } from "vitest";
import { readUrlPdf, normalizeBase64 } from "@/lib/pwa/urlPdf";

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("readUrlPdf", () => {
  it("returns null when there is no #pdf= fragment", () => {
    window.history.replaceState({}, "", "/");
    expect(readUrlPdf()).toBeNull();
  });

  it("decodes a base64 PDF from the URL fragment", () => {
    const original = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    window.history.replaceState({}, "", "/#pdf=" + toBase64(original));
    const buf = readUrlPdf();
    expect(buf).not.toBeNull();
    expect(new Uint8Array(buf!)).toEqual(original);
  });

  it("tolerates a percent-encoded fragment and whitespace", () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const b64 = toBase64(original);
    window.history.replaceState({}, "", "/#pdf=" + encodeURIComponent(b64));
    const buf = readUrlPdf();
    expect(new Uint8Array(buf!)).toEqual(original);
  });

  it("recovers when '+' was turned into a space in transit", () => {
    // bytes 0xfb 0xff 0xbf base64-encode to "+/+/" (contains '+')
    const original = new Uint8Array([0xfb, 0xff, 0xbf, 0x25, 0x50, 0x44, 0x46]);
    const corrupted = toBase64(original).replace(/\+/g, " ");
    window.history.replaceState({}, "", "/#pdf=" + corrupted);
    const buf = readUrlPdf();
    expect(buf).not.toBeNull();
    expect(new Uint8Array(buf!)).toEqual(original);
  });

  it("clears the fragment after reading so a refresh does not reload", () => {
    const original = new Uint8Array([9, 9, 9]);
    window.history.replaceState({}, "", "/#pdf=" + toBase64(original));
    readUrlPdf();
    expect(window.location.hash).toBe("");
  });
});

describe("normalizeBase64", () => {
  it("restores '+' that was turned into a space", () => {
    const std = btoa("\xfb\xff\xbf"); // "+/+/"
    expect(normalizeBase64(std.replace(/\+/g, " "))).toBe(std);
  });

  it("converts base64url back to standard base64", () => {
    const std = btoa("\xfb\xff\xbf");
    const url = std.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(normalizeBase64(url)).toBe(std);
  });

  it("strips MIME line breaks and repairs padding", () => {
    const std = btoa("a longer string that base64 wraps at 76 chars in MIME mode");
    const wrapped = std.replace(/(.{8})/g, "$1\r\n");
    expect(normalizeBase64(wrapped)).toBe(std);
  });
});
