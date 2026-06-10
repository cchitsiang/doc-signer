import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Pencil, Type, Image } from "lucide-react";

export type Tool = "signature" | "text" | "saved" | null;

interface Props {
  tool: Tool;
  onTool: (t: Tool) => void;
}

export function Toolbar({ tool, onTool }: Props) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-10 flex justify-center p-4">
      <div className="rounded-full bg-card border border-border shadow-md px-3 py-2">
        <ToggleGroup
          value={tool ? [tool] : []}
          onValueChange={(groupValue) => onTool(((groupValue[0] as Tool) ?? null) as Tool)}
        >
          <ToggleGroupItem value="signature" aria-label="Draw signature">
            <Pencil size={18} />
          </ToggleGroupItem>
          <ToggleGroupItem value="text" aria-label="Add text">
            <Type size={18} />
          </ToggleGroupItem>
          <ToggleGroupItem value="saved" aria-label="Saved signature">
            <Image size={18} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
