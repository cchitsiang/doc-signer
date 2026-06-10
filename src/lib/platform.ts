/** True on iPhone/iPad/iPod, including iPadOS 13+ which reports as a Mac with touch. */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return ua.includes("Macintosh") && typeof document !== "undefined" && "ontouchend" in document;
}
