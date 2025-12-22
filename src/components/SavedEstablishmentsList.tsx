import { useEffect, useState, useCallback } from "react";
import { Etab, STORAGE_KEY, EVT_LIST_UPDATED, EVT_SAVED } from "../types/etablissement";
import EstablishmentItem from "./EstablishmentItem";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

export default function SavedEstablishmentsList() {
  const [establishments, setEstablishments] = useState<Etab[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEstablishment, setActiveEstablishment] = useState<Etab | null>(null);
  const [deletingPlaceId, setDeletingPlaceId] = useState<string | null>(null);

  // Charger l'établissement actif depuis localStorage
  useEffect(() => {
    const loadActive = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          setActiveEstablishment(JSON.parse(raw));
        }
      } catch (e) {
        console.error("Erreur lecture établissement actif:", e);
      }
    };
    loadActive();

    const onSaved = (e: any) => {
      setActiveEstablishment(e.detail as Etab);
    };
    window.addEventListener(EVT_SAVED, onSaved);
    return () => window.removeEventListener(EVT_SAVED, onSaved);
  }, []);

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

  // Supprimer un établissement
  const handleDeleteEstablishment = async (etab: Etab) => {
    if (!etab.place_id) return;

    setDeletingPlaceId(etab.place_id);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        sonnerToast.error("Vous devez être connecté pour supprimer un établissement");
        return;
      }

      // 1. Supprimer de la table "établissements" (source de vérité)
      const { error: etabError } = await supabase
        .from("établissements")
        .delete()
        .eq("user_id", user.id)
        .eq("place_id", etab.place_id);
      
      if (etabError) {
        console.error("Erreur suppression établissements:", etabError);
        throw etabError;
      }

      // 2. Si c'était l'établissement actif, le vider
      if (activeEstablishment?.place_id === etab.place_id) {
        localStorage.removeItem(STORAGE_KEY);
        setActiveEstablishment(null);
        window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: null }));
      }

      // 3. Recharger la liste depuis la DB (source de vérité)
      await loadEstablishmentsFromDb();

      sonnerToast.success(`"${etab.name}" supprimé`, { duration: 3000 });

    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      sonnerToast.error("Impossible de supprimer l'établissement", { duration: 5000 });
    } finally {
      setDeletingPlaceId(null);
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
          {establishments.map((etab) => {
            const isDeleting = deletingPlaceId === etab.place_id;
            return (
              <EstablishmentItem
                key={etab.place_id}
                etab={etab}
                onSelect={handleSelectEstablishment}
                onDelete={handleDeleteEstablishment}
                isDeleting={isDeleting}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
