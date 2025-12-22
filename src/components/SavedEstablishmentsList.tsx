import { useEffect, useState, useCallback } from "react";
import { Etab, STORAGE_KEY, EVT_LIST_UPDATED, EVT_SAVED } from "../types/etablissement";
import EstablishmentItem from "./EstablishmentItem";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function SavedEstablishmentsList() {
  const [establishments, setEstablishments] = useState<Etab[]>([]);
  const [loading, setLoading] = useState(true);


  // Fonction pour charger les établissements UNIQUEMENT depuis la DB
  const loadEstablishmentsFromDb = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setEstablishments([]);
        return;
      }

      // Charger depuis la table "établissements" (source de vérité unique)
      const { data: etablissements, error } = await supabase
        .from("établissements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur chargement établissements:", error);
        setEstablishments([]);
        return;
      }

      // Convertir vers le format Etab
      const dbList: Etab[] = (etablissements || []).map((etab) => ({
        place_id: etab.place_id,
        name: etab.nom,
        address: etab.adresse || "",
        lat: null,
        lng: null,
        phone: etab.telephone || "",
        website: "",
        url: "",
        rating: null,
      }));

      setEstablishments(dbList);
    } catch (error) {
      console.error("Erreur lors du chargement de la liste:", error);
      setEstablishments([]);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    const load = async () => {
      await loadEstablishmentsFromDb();
      setLoading(false);
    };
    load();
  }, [loadEstablishmentsFromDb]);

  // Écouter les mises à jour de la liste (après ajout/suppression)
  useEffect(() => {
    const onListUpdated = () => {
      loadEstablishmentsFromDb();
    };
    window.addEventListener(EVT_LIST_UPDATED, onListUpdated);
    return () => window.removeEventListener(EVT_LIST_UPDATED, onListUpdated);
  }, [loadEstablishmentsFromDb]);

  // Définir un établissement comme principal
  const handleSelectEstablishment = (etab: Etab) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(etab));
    window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: etab }));
    
    // Scroll smooth vers le haut
    document.querySelector('[data-testid="card-mon-etablissement"]')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };


  if (loading) {
    return (
      <section className="p-4 border border-border rounded-lg bg-card/50">
        <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Établissements enregistrés
        </h3>
        <div className="text-muted-foreground text-sm">Chargement...</div>
      </section>
    );
  }

  return (
    <section className="p-4 border border-border rounded-lg bg-card/50">
      <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        Établissements enregistrés
      </h3>
      
      {establishments.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucun établissement enregistré pour le moment.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {establishments.map((etab) => (
            <EstablishmentItem
              key={etab.place_id}
              etab={etab}
              onSelect={handleSelectEstablishment}
            />
          ))}
        </div>
      )}
    </section>
  );
}
