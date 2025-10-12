import { useState, useEffect } from "react";
import { Building2, Phone, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Etab } from "@/types/etablissement";
import { getPlaceDetails, normalizePhoneNumber, PlaceDetailsResponse } from "@/services/placeDetails";

interface EstablishmentItemProps {
  etab: Etab;
  onSelect: (etab: Etab) => void;
  onDelete?: (etab: Etab) => void;
}

export default function EstablishmentItem({ etab, onSelect, onDelete }: EstablishmentItemProps) {
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

  const displayPhone = placeDetails?.phone || etab.phone;
  const displayMapsUrl = placeDetails?.mapsUrl;

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayPhone) {
      window.location.href = `tel:${normalizePhoneNumber(displayPhone)}`;
    }
  };

  const handleMapsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayMapsUrl) {
      window.open(displayMapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Voulez-vous vraiment supprimer "${etab.name}" ?`)) {
      onDelete(etab);
    }
  };

  return (
    <TooltipProvider>
      <div
        onClick={() => onSelect(etab)}
        className="cursor-pointer bg-card border border-border rounded-lg p-3 min-w-[200px] max-w-[250px] shadow-sm hover:shadow-md hover:bg-accent/5 transition-all relative"
      >
        <div className="flex items-start gap-2">
          <div className="mt-1 text-primary">
            <Building2 className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate" title={etab.name}>
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
        
        {/* Icône de suppression en bas à droite */}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="absolute bottom-1 right-1 h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
            title="Supprimer cet établissement"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}