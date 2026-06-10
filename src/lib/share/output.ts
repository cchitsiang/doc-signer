export function makePdfFile(bytes: Uint8Array, filename: string): File {
  const blob = new Blob([bytes], { type: "application/pdf" });
  return new File([blob], filename, { type: "application/pdf" });
}

export function download(bytes: Uint8Array, filename: string): void {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function canShareFiles(file: File): boolean {
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
  return typeof nav.canShare === "function" && nav.canShare({ files: [file] });
}

export async function shareToWhatsApp(bytes: Uint8Array, filename: string): Promise<boolean> {
  const file = makePdfFile(bytes, filename);
  if (!canShareFiles(file)) return false;
  try {
    await navigator.share({ files: [file], title: filename });
    return true;
  } catch {
    return false;
  }
}

export function printPdf(bytes: Uint8Array): void {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };
  document.body.appendChild(iframe);
}
