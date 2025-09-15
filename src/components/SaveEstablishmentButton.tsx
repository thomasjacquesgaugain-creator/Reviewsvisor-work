import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EstablishmentIconSelector } from "@/components/EstablishmentIconSelector";
import { saveEstablishmentFromPlaceDetails } from "@/services/establishments";
import { useToast } from "@/hooks/use-toast";
import { Etab } from "@/types/etablissement";

interface SaveEstablishmentButtonProps {
  selected: Etab | null;
}

export default function SaveEstablishmentButton({ selected }: SaveEstablishmentButtonProps) {
  const [selectedIcon, setSelectedIcon] = useState("Restaurant");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!selected) return;

    setIsSaving(true);
    try {
      const establishmentData = {
        place_id: selected.place_id,
        name: selected.name,
        formatted_address: selected.address,
        lat: selected.lat,
        lng: selected.lng,
        rating: selected.rating,
        phone: selected.phone,
        website: selected.website,
        url: selected.url,
        icon_type: selectedIcon, // Ajouter le type d'icône
      };

      await saveEstablishmentFromPlaceDetails(establishmentData);

      toast({
        title: "Établissement enregistré",
        description: `${selected.name} a été ajouté avec l'icône ${selectedIcon}`,
      });
      
      // Déclencher un événement pour rafraîchir la sidebar
      window.dispatchEvent(new CustomEvent('establishment-saved'));

    } catch (error) {
      console.error('Error saving establishment:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'établissement",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!selected) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Choisir une icône pour cet établissement :
        </label>
        <EstablishmentIconSelector 
          selectedIcon={selectedIcon}
          onIconSelect={setSelectedIcon}
        />
      </div>
      
      <Button 
        onClick={handleSave} 
        disabled={!selected || isSaving}
        className="w-full"
      >
        {isSaving ? "Enregistrement..." : "Enregistrer l'établissement"}
      </Button>
    </div>
  );
}