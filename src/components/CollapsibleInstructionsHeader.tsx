import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";

interface CollapsibleInstructionsHeaderProps {
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

/**
 * Header "Instructions" repliable avec icône info + chevron
 * Réutilisable dans tous les onglets d'import
 */
export default function CollapsibleInstructionsHeader({ 
  defaultOpen = false,
  children 
}: CollapsibleInstructionsHeaderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-foreground">Instructions</span>
        </div>
        <div 
          className="transition-transform duration-200" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: isOpen ? '200px' : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-4 py-3 text-sm text-muted-foreground border-t border-border">
          {children}
        </div>
      </div>
    </div>
  );
}
