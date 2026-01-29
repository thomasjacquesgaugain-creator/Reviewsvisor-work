/**
 * Composant discret pour afficher le type de commerce détecté
 * Affiche un encart si confidence < 75 avec les candidats
 */

import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { BusinessType, BUSINESS_TYPE_LABELS } from "@/config/industry";

interface BusinessTypeIndicatorProps {
  businessType: BusinessType | null | undefined;
  confidence: number | null | undefined;
  candidates?: Array<{ type: BusinessType; confidence: number }>;
  onOverrideClick?: () => void;
}

export function BusinessTypeIndicator({
  businessType,
  confidence,
  candidates = [],
  onOverrideClick
}: BusinessTypeIndicatorProps) {
  if (!businessType || confidence === null || confidence === undefined) {
    return null;
  }

  // Si confidence élevée, ne rien afficher (tout est normal)
  if (confidence >= 75) {
    return null;
  }

  // Si confidence faible, afficher un encart discret avec les candidats
  return (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-blue-900 font-medium mb-1">
            Type probable : {BUSINESS_TYPE_LABELS[businessType]}
          </p>
          {candidates.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {candidates.slice(0, 3).map((candidate, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs bg-white border-blue-300 text-blue-700"
                >
                  {BUSINESS_TYPE_LABELS[candidate.type]} ({candidate.confidence}%)
                </Badge>
              ))}
            </div>
          )}
          {onOverrideClick && (
            <button
              onClick={onOverrideClick}
              className="text-xs text-blue-600 hover:text-blue-800 underline mt-2"
            >
              Corriger le type
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
