import { useEffect, useState } from "react";
import { Etab, STORAGE_KEY_LIST, STORAGE_KEY, EVT_LIST_UPDATED, EVT_SAVED } from "../types/etablissement";
import EstablishmentItem from "./EstablishmentItem";
import { Building } from "lucide-react";

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
            .from("establishments")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!error && etablissements) {
            // Convertir le format de la base vers le format Etab
            const convertedEstabs: Etab[] = etablissements.map(etab => ({
              place_id: etab.place_id,
              name: etab.name,
              address: etab.formatted_address || "",
              lat: etab.lat,
              lng: etab.lng,
              phone: etab.phone || "",
              website: etab.website || "",
              url: "",
              rating: etab.rating || null
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

  // Définir un établissement comme principal
  const handleSelectEstablishment = (etab: Etab) => {
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
    <section className="p-4 border border-border rounded-lg bg-card/50">
      <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
        <Building className="w-5 h-5 text-primary" />
        Mes Établissements Enregistrés
      </h3>
      
      <div className="flex flex-wrap gap-3">
        {establishments.map((etab) => (
          <EstablishmentItem
            key={etab.place_id}
            etab={etab}
            onSelect={handleSelectEstablishment}
          />
        ))}
      </div>
    </section>
  );
}