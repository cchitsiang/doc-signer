import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isIOS } from "@/lib/platform";
import { IOS_SHORTCUT_URL } from "@/config";
import { useInstallPrompt } from "@/lib/pwa/useInstallPrompt";
import { Smartphone, Download } from "lucide-react";

interface Props {
  onFile: (bytes: ArrayBuffer, name: string) => void;
  error?: string;
}

export function LandingScreen({ onFile, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { canInstall, promptInstall } = useInstallPrompt();

  async function pick(file: File | undefined) {
    if (!file) return;
    const buf = await file.arrayBuffer();
    onFile(buf, file.name);
  }

  return (
    <div
      className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-6"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void pick(e.dataTransfer.files?.[0]);
      }}
    >
      <Card className="max-w-md w-full p-8 text-center flex flex-col gap-4 items-center">
        <h1 className="text-2xl font-semibold">Doc Signer</h1>
        <p className="text-muted-foreground">
          Open a PDF to sign it. Everything stays on your device.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0])}
        />
        <Button onClick={() => inputRef.current?.click()}>Open PDF</Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <p className="text-xs text-muted-foreground">or drag &amp; drop a PDF here</p>
      </Card>

      <div className="absolute bottom-6 inset-x-0 mx-auto flex w-fit flex-col items-center gap-2">
        {canInstall && (
          <button
            onClick={() => void promptInstall()}
            className="text-muted-foreground hover:text-primary flex items-center gap-1.5 text-sm transition-colors"
          >
            <Download className="size-4" />
            Install Doc Signer for one-tap WhatsApp sharing
          </button>
        )}
        {IOS_SHORTCUT_URL && isIOS() && (
          <a
            href={IOS_SHORTCUT_URL}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-primary flex items-center gap-1.5 text-sm transition-colors"
          >
            <Smartphone className="size-4" />
            Add the “Sign PDF” shortcut to share from WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
