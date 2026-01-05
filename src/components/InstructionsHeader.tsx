import { Info } from "lucide-react";

/**
 * Header "Instructions" simple (sans accordéon)
 * Affiche une icône info + texte "Instructions"
 */
export default function InstructionsHeader() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border border-border rounded-lg">
      <Info className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-medium text-foreground">Instructions</span>
    </div>
  );
}
