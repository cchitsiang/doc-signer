import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SignatureCanvas, type SignatureCanvasHandle } from "@/components/SignatureCanvas";
import { listSignatures, saveSignature, type SavedSignature } from "@/lib/signature/storage";
import { UploadCloud, Eraser } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dataUrl: string) => void;
}

export function SignatureDialog({ open, onOpenChange, onConfirm }: Props) {
  const padRef = useRef<SignatureCanvasHandle>(null);
  const [saved, setSaved] = useState<SavedSignature[]>([]);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState("draw");

  // Load saved signatures each time the dialog opens (App controls `open`, so the
  // dialog's own onOpenChange does not fire on programmatic open). When saved
  // signatures exist, open straight to the Saved tab.
  useEffect(() => {
    if (!open) return;
    const sigs = listSignatures();
    setSaved(sigs);
    setTab(sigs.length > 0 ? "saved" : "draw");
  }, [open]);

  function confirmDrawn(persist: boolean) {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    const dataUrl = pad.toDataURL();
    if (persist) saveSignature(dataUrl);
    onConfirm(dataUrl);
    onOpenChange(false);
  }

  function acceptImageFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
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
          <DialogDescription>Draw, reuse a saved signature, or upload an image.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-3">
            <div className="relative h-44 w-full overflow-hidden rounded-md border border-border bg-card">
              <SignatureCanvas ref={padRef} className="h-full w-full" />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="absolute bottom-2 left-2 size-8 rounded-full"
                onClick={() => padRef.current?.clear()}
                aria-label="Clear"
              >
                <Eraser className="size-4" />
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => confirmDrawn(true)}>
                Save & use
              </Button>
              <Button onClick={() => confirmDrawn(false)}>Use once</Button>
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="grid grid-cols-2 gap-2">
              {saved.length === 0 && (
                <p className="text-muted-foreground col-span-2 py-6 text-center text-sm">
                  No saved signatures yet.
                </p>
              )}
              {saved.map((s) => (
                <button
                  key={s.id}
                  className="hover:border-primary rounded-md border border-border bg-card p-2 transition-colors"
                  onClick={() => {
                    onConfirm(s.dataUrl);
                    onOpenChange(false);
                  }}
                >
                  <img src={s.dataUrl} alt="saved signature" className="mx-auto max-h-20" />
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                acceptImageFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-center transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <UploadCloud className="text-muted-foreground size-8" />
              <span className="text-sm font-medium">Drop an image here, or click to browse</span>
              <span className="text-muted-foreground text-xs">
                PNG or JPG with a transparent background works best
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => acceptImageFile(e.target.files?.[0])}
              />
            </label>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
