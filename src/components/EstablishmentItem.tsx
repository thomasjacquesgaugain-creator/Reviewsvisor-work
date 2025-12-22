import { useState, useEffect } from "react";
import { Building2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Etab } from "@/types/etablissement";
import { getPlaceDetails, PlaceDetailsResponse } from "@/services/placeDetails";

interface EstablishmentItemProps {
  etab: Etab;
  onSelect: (etab: Etab) => void;
  onDelete?: (etab: Etab) => void;
  isDeleting?: boolean;
}

export default function EstablishmentItem({ etab, onSelect, onDelete, isDeleting }: EstablishmentItemProps) {
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && !isDeleting) {
      onDelete(etab);
    }
  };

  return (
    <TooltipProvider>
      <div
        onClick={() => onSelect(etab)}
        className="cursor-pointer bg-card border border-border rounded-lg p-3 min-w-[200px] max-w-[250px] shadow-sm hover:shadow-md hover:bg-accent/5 transition-all relative group"
      >
        <div className="flex items-start gap-2">
          <div className="text-primary mt-0.5">
            <Building2 className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate pr-6" title={etab.name}>
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

          {/* Bouton supprimer - visible au hover */}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="absolute top-1 right-1 p-1 h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              title="Supprimer cet établissement"
            >
              <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
