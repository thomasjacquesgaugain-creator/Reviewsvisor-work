import { useEffect, useState } from "react";
import { Etab, STORAGE_KEY_LIST, STORAGE_KEY, EVT_LIST_UPDATED, EVT_SAVED } from "../types/etablissement";
import { Building2, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function SavedEstablishmentsList() {
  const [establishments, setEstablishments] = useState<Etab[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger la liste au montage (local + base de données)
  useEffect(() => {
    const loadEstablishments = async () => {
      try {
        // 1) Charger depuis localStorage en premier
        const rawLocal = localStorage.getItem(STORAGE_KEY_LIST);
        if (rawLocal) {
          setEstablishments(JSON.parse(rawLocal));
        }

        // 2) Essayer de charger depuis la base de données si connecté
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!authError && user) {
          const { data: etablissements, error } = await supabase
            .from("établissements")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!error && etablissements) {
            // Convertir le format de la base vers le format Etab
            const convertedEstabs: Etab[] = etablissements.map(etab => ({
              place_id: etab.place_id,
              name: etab.nom,
              address: etab.adresse || "",
              lat: null,
              lng: null,
              phone: etab.telephone || "",
              website: "",
              url: "",
              rating: null
            }));
            
            setEstablishments(convertedEstabs);
            // Synchroniser avec localStorage
            localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(convertedEstabs));
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la liste:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEstablishments();
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
  const handleRemove = async (place_id: string) => {
    try {
      const updatedList = establishments.filter(etab => etab.place_id !== place_id);
      setEstablishments(updatedList);
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(updatedList));
      
      // Supprimer aussi de la base de données si connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("établissements")
          .delete()
          .eq("user_id", user.id)
          .eq("place_id", place_id);
      }
      
      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED, { detail: updatedList }));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  // Définir un établissement comme principal
  const handleSetAsPrimary = (etab: Etab) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(etab));
    window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: etab }));
  };

  if (loading) {
    return <div className="text-muted-foreground">Chargement...</div>;
  }

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
            
            {/* Boutons d'action */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              {/* Bouton définir comme principal */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetAsPrimary(etab)}
                className="p-1 h-auto w-auto text-primary hover:text-primary hover:bg-primary/10"
                title="Définir comme établissement principal"
              >
                <Star className="w-3 h-3" />
              </Button>
              
              {/* Bouton supprimer */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(etab.place_id)}
                className="p-1 h-auto w-auto text-muted-foreground hover:text-destructive"
                title="Supprimer de la liste"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}