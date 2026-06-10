import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { listSignatures, saveSignature, type SavedSignature } from "@/lib/signature/storage";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dataUrl: string) => void;
}

export function SignatureDialog({ open, onOpenChange, onConfirm }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [saved, setSaved] = useState<SavedSignature[]>([]);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const pad = new SignaturePad(canvasRef.current, { penColor: "#1a1a1a" });
    padRef.current = pad;
    setSaved(listSignatures());
    return () => pad.off();
  }, [open]);

  function confirmDrawn(persist: boolean) {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    const dataUrl = pad.toDataURL("image/png");
    if (persist) saveSignature(dataUrl);
    onConfirm(dataUrl);
    onOpenChange(false);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onConfirm(reader.result as string);
      onOpenChange(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add signature</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="draw">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw">
            <canvas
              ref={canvasRef}
              width={460}
              height={180}
              className="w-full rounded-md border border-border bg-card touch-none"
            />
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={() => padRef.current?.clear()}>
                Clear
              </Button>
              <Button variant="secondary" onClick={() => confirmDrawn(true)}>
                Save & use
              </Button>
              <Button onClick={() => confirmDrawn(false)}>Use once</Button>
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="grid grid-cols-2 gap-2">
              {saved.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-2">No saved signatures yet.</p>
              )}
              {saved.map((s) => (
                <button
                  key={s.id}
                  className="rounded-md border border-border bg-card p-2"
                  onClick={() => {
                    onConfirm(s.dataUrl);
                    onOpenChange(false);
                  }}
                >
                  <img src={s.dataUrl} alt="saved signature" className="max-h-20 mx-auto" />
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <input type="file" accept="image/png,image/jpeg" onChange={handleUpload} />
          </TabsContent>
        </Tabs>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
