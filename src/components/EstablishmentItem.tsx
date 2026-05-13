import { useState, useEffect } from "react";
import { Building2, Check } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Etab } from "@/types/etablissement";
import { getPlaceDetails, PlaceDetailsResponse } from "@/services/placeDetails";
import {
  ESTABLISHMENT_CARD_HOVER,
  ESTABLISHMENT_CARD_HOVER_ACTIVE,
  ESTABLISHMENT_CARD_HOVER_NEUTRAL,
} from "@/lib/establishmentCardStyles";

interface EstablishmentItemProps {
  etab: Etab;
  onSelect: (etab: Etab) => void;
  isActive?: boolean;
}

export default function EstablishmentItem({ etab, onSelect, isActive = false }: EstablishmentItemProps) {
  const [placeDetails, setPlaceDetails] = useState<PlaceDetailsResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch place details when component mounts
  useEffect(() => {
    if (etab.place_id && !placeDetails) {
      setLoadingDetails(true);
      getPlaceDetails(etab.place_id)
        .then(setPlaceDetails)
        .catch(console.error)
        .finally(() => setLoadingDetails(false));
    }
  }, [etab.place_id, placeDetails]);

  return (
    <TooltipProvider>
      <div
        onClick={() => onSelect(etab)}
        className={`cursor-pointer bg-card text-card-foreground border-2 rounded-lg p-3 min-w-[200px] max-w-[250px] shadow-sm relative ${ESTABLISHMENT_CARD_HOVER} ${
          isActive
            ? `border-primary bg-primary/10 ${ESTABLISHMENT_CARD_HOVER_ACTIVE}`
            : `border-border ${ESTABLISHMENT_CARD_HOVER_NEUTRAL}`
        }`}
      >
        {isActive && (
          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
          </div>
        )}
        <div className="flex items-start gap-2">
          <div className="mt-0.5 text-primary">
            <Building2 className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="truncate text-sm font-medium text-foreground" title={etab.name}>
              {etab.name}
            </h4>
            <p className="text-xs text-muted-foreground truncate" title={etab.address}>
              {etab.address}
            </p>
            
            {etab.rating && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-500">⭐</span>
                <span className="text-xs text-muted-foreground">{etab.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
