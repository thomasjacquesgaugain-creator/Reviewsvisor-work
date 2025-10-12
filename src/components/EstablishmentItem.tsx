import { useState, useEffect } from "react";
import { Building2, Phone, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(etab);
    }
    setShowDeleteDialog(false);
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
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="absolute bottom-1 right-1 h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
              title="Supprimer cet établissement"
            >
              <Trash2 className="w-3 h-3" />
            </Button>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr de supprimer l'établissement ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Vous êtes sur le point de supprimer <strong className="text-foreground">"{etab.name}"</strong>. 
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-blue-500 text-white hover:bg-blue-600">
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={confirmDelete}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}