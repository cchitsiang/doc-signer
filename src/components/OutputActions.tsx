import { Button } from "@/components/ui/button";
import { Download, Share2, Printer } from "lucide-react";

interface Props {
  onDownload: () => void;
  onShare: () => void;
  onPrint: () => void;
  canShare: boolean;
  busy: boolean;
}

export function OutputActions({ onDownload, onShare, onPrint, canShare, busy }: Props) {
  return (
    <div className="fixed top-0 inset-x-0 z-10 flex justify-end gap-2 p-3 bg-background/80 backdrop-blur border-b border-border">
      <Button variant="outline" size="sm" onClick={onPrint} disabled={busy}>
        <Printer size={16} /> Print
      </Button>
      {canShare && (
        <Button variant="outline" size="sm" onClick={onShare} disabled={busy}>
          <Share2 size={16} /> Share
        </Button>
      )}
      <Button size="sm" onClick={onDownload} disabled={busy}>
        <Download size={16} /> Download
      </Button>
    </div>
  );
}
