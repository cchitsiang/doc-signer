const KEY = "doc-signer:signatures";

export interface SavedSignature {
  id: string;
  dataUrl: string;
  createdAt: number;
}

function read(): SavedSignature[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: SavedSignature[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function listSignatures(): SavedSignature[] {
  return read();
}

export function saveSignature(dataUrl: string): SavedSignature {
  const item: SavedSignature = {
    id: `sig_${read().length}_${dataUrl.length}`,
    dataUrl,
    createdAt: 0,
  };
  write([...read(), item]);
  return item;
}

export function deleteSignature(id: string): void {
  write(read().filter((s) => s.id !== id));
}
