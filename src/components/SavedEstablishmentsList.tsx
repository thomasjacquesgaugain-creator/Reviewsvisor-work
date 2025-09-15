import { useEffect, useState } from "react";
import { Etab, STORAGE_KEY_LIST, EVT_LIST_UPDATED } from "../types/etablissement";
import { Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SavedEstablishmentsList() {
  const [establishments, setEstablishments] = useState<Etab[]>([]);

  // Charger la liste au montage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIST);
      if (raw) {
        setEstablishments(JSON.parse(raw));
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la liste:", error);
    }
  }, []);

  // Écouter les mises à jour de la liste
  useEffect(() => {
    const onListUpdated = (e: any) => {
      setEstablishments(e.detail as Etab[]);
    };
    window.addEventListener(EVT_LIST_UPDATED, onListUpdated);
    return () => window.removeEventListener(EVT_LIST_UPDATED, onListUpdated);
  }, []);

  // Supprimer un établissement de la liste
  const handleRemove = (place_id: string) => {
    try {
      const updatedList = establishments.filter(etab => etab.place_id !== place_id);
      setEstablishments(updatedList);
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED, { detail: updatedList }));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  if (establishments.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Mes Établissements Enregistrés
      </h3>
      
      <div className="flex flex-wrap gap-3">
        {establishments.map((etab) => (
          <div
            key={etab.place_id}
            className="relative group bg-card border border-border rounded-lg p-3 min-w-[200px] max-w-[250px] shadow-sm hover:shadow-md transition-shadow"
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
            
            {/* Bouton supprimer */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(etab.place_id)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto w-auto text-muted-foreground hover:text-destructive"
              title="Supprimer de la liste"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}