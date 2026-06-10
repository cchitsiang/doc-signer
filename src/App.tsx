import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { loadPdf, type LoadedPdf } from "@/lib/pdf/loader";
import { readSharedPdf } from "@/lib/pwa/shareTarget";
import { exportPdf } from "@/lib/pdf/exporter";
import { useAnnotations, type Annotation } from "@/state/annotations";
import type { PageGeometry, ScreenRect } from "@/lib/pdf/coordinates";
import { LandingScreen } from "@/components/LandingScreen";
import { Viewer } from "@/components/Viewer";
import { Toolbar, type Tool } from "@/components/Toolbar";
import { OutputActions } from "@/components/OutputActions";
import { SignatureDialog } from "@/components/SignatureDialog";
import { TextDialog } from "@/components/TextDialog";
import {
  download,
  shareToWhatsApp,
  printPdf,
  makePdfFile,
  canShareFiles,
} from "@/lib/share/output";

const SCALE = 1.5;

export default function App() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [error, setError] = useState<string>();
  const [tool, setTool] = useState<Tool>(null);
  const [sigOpen, setSigOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { items, dispatch } = useAnnotations();
  const originalBytes = useRef<ArrayBuffer | null>(null);
  const geometries = useRef<PageGeometry[]>([]);
  const pendingPlace = useRef<{ pageIndex: number; at: { x: number; y: number } } | null>(null);

  const handleFile = useCallback(async (bytes: ArrayBuffer, _name: string) => {
    try {
      originalBytes.current = bytes.slice(0);
      const loaded = await loadPdf(bytes);
      setPdf(loaded);
      setError(undefined);
    } catch {
      setError("That file could not be opened as a PDF.");
      toast.error("Invalid PDF file");
    }
  }, []);

  const onGeometry = useCallback((pageIndex: number, geom: PageGeometry) => {
    geometries.current[pageIndex] = geom;
  }, []);

  useEffect(() => {
    void (async () => {
      const shared = await readSharedPdf();
      if (shared) await handleFile(shared, "shared.pdf");
    })();
  }, [handleFile]);

  // Press Escape to deselect the active annotation tool.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTool(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function nextId() {
    return `ann_${items.length}_${Date.now()}`;
  }

  const onPlace = useCallback(
    (pageIndex: number, at: { x: number; y: number }) => {
      if (!tool) return;
      pendingPlace.current = { pageIndex, at };
      if (tool === "text") {
        setTextOpen(true);
      } else {
        // signature or saved -> open the signature dialog
        setSigOpen(true);
      }
    },
    [tool],
  );

  function onTextConfirm(text: string) {
    const place = pendingPlace.current ?? { pageIndex: 0, at: { x: 40, y: 40 } };
    const ann: Annotation = {
      id: nextId(),
      type: "text",
      pageIndex: place.pageIndex,
      rect: { x: place.at.x, y: place.at.y, width: Math.max(80, text.length * 12), height: 32 },
      payload: { text, fontSizePx: 24, color: "#1a1a1a" },
    };
    dispatch({ type: "add", annotation: ann });
    pendingPlace.current = null;
  }

  function onSignatureConfirm(dataUrl: string) {
    const place = pendingPlace.current ?? { pageIndex: 0, at: { x: 40, y: 40 } };
    const ann: Annotation = {
      id: nextId(),
      type: "signature",
      pageIndex: place.pageIndex,
      rect: { x: place.at.x, y: place.at.y, width: 200, height: 80 },
      payload: { dataUrl },
    };
    dispatch({ type: "add", annotation: ann });
    pendingPlace.current = null;
  }

  const onChangeRect = useCallback(
    (id: string, rect: ScreenRect) => dispatch({ type: "update", id, patch: { rect } }),
    [dispatch],
  );
  const onRemove = useCallback((id: string) => dispatch({ type: "remove", id }), [dispatch]);

  async function buildPdf(): Promise<Uint8Array | null> {
    if (!originalBytes.current) return null;
    return exportPdf(originalBytes.current, items, geometries.current);
  }

  async function handleDownload() {
    setBusy(true);
    try {
      const out = await buildPdf();
      if (out) download(out, "signed.pdf");
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    setBusy(true);
    try {
      const out = await buildPdf();
      if (out && !(await shareToWhatsApp(out, "signed.pdf"))) {
        toast.message("Sharing not available — downloaded instead");
        download(out, "signed.pdf");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handlePrint() {
    setBusy(true);
    try {
      const out = await buildPdf();
      if (out) printPdf(out);
    } finally {
      setBusy(false);
    }
  }

  if (!pdf) return <LandingScreen onFile={handleFile} error={error} />;

  const shareProbe = makePdfFile(new Uint8Array([1]), "x.pdf");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OutputActions
        onDownload={handleDownload}
        onShare={handleShare}
        onPrint={handlePrint}
        canShare={canShareFiles(shareProbe)}
        busy={busy}
      />
      <div className="pt-16">
        <Viewer
          pdf={pdf}
          scale={SCALE}
          annotations={items}
          onGeometry={onGeometry}
          onPlace={onPlace}
          onChangeRect={onChangeRect}
          onRemove={onRemove}
        />
      </div>
      <Toolbar tool={tool} onTool={setTool} />
      <SignatureDialog open={sigOpen} onOpenChange={setSigOpen} onConfirm={onSignatureConfirm} />
      <TextDialog open={textOpen} onOpenChange={setTextOpen} onConfirm={onTextConfirm} />
    </div>
  );
}
