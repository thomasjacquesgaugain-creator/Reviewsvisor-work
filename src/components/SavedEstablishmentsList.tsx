import { useEffect, useState, useCallback } from "react";
import { Etab, EVT_LIST_UPDATED, EVT_SAVED } from "../types/etablissement";
import EstablishmentItem from "./EstablishmentItem";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

export default function SavedEstablishmentsList() {
  const [establishments, setEstablishments] = useState<Etab[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingActive, setSettingActive] = useState<string | null>(null);

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

      // Convertir vers le format Etab avec toutes les infos de la DB
      const dbList: Etab[] = (etablissements || []).map((etab) => ({
        place_id: etab.place_id,
        name: etab.nom,
        address: etab.adresse || "",
        lat: etab.lat || null,
        lng: etab.lng || null,
        phone: etab.telephone || undefined,
        website: etab.website || undefined,
        url: etab.google_maps_url || undefined,
        rating: etab.rating || null,
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

  // Définir un établissement comme actif dans la DB (source de vérité)
  const handleSelectEstablishment = async (etab: Etab) => {
    setSettingActive(etab.place_id);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        sonnerToast.error("Vous devez être connecté");
        return;
      }

      // Mettre à jour is_active=true dans la DB
      // Le trigger va automatiquement désactiver les autres
      const { error } = await supabase
        .from("établissements")
        .update({ is_active: true })
        .eq("user_id", user.id)
        .eq("place_id", etab.place_id);

      if (error) {
        console.error("Erreur définition établissement actif:", error);
        sonnerToast.error("Impossible de sélectionner cet établissement");
        return;
      }

      // Notifier MonEtablissementCard de recharger depuis la DB
      window.dispatchEvent(new CustomEvent(EVT_SAVED));
      
      // Scroll smooth vers le haut
      document.querySelector('[data-testid="card-mon-etablissement"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      sonnerToast.success(`"${etab.name}" défini comme établissement actif`);
    } catch (err) {
      console.error("Erreur:", err);
      sonnerToast.error("Une erreur est survenue");
    } finally {
      setSettingActive(null);
    }
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
