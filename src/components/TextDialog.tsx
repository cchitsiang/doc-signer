import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (text: string) => void;
}

export function TextDialog({ open, onOpenChange, onConfirm }: Props) {
  const [value, setValue] = useState("");

  // Reset the field whenever the dialog opens.
  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add text</DialogTitle>
          <DialogDescription>Type the text to place on the page.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={value}
          placeholder="e.g. your name, a date…"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!value.trim()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
