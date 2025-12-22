import { useEffect, useState } from "react";
import { Etab, STORAGE_KEY_LIST, STORAGE_KEY, EVT_LIST_UPDATED, EVT_SAVED } from "../types/etablissement";
import EstablishmentItem from "./EstablishmentItem";
import { Building2, CheckCircle } from "lucide-react";
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

  // Fonction pour charger les établissements depuis la DB (source de vérité)
  const loadEstablishmentsFromDb = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        // Non connecté: utiliser localStorage seulement
        const rawLocal = localStorage.getItem(STORAGE_KEY_LIST);
        if (rawLocal) {
          setEstablishments(JSON.parse(rawLocal));
        } else {
          setEstablishments([]);
        }
        return;
      }

      // Charger depuis la table "établissements" (source de vérité)
      const { data: etablissements, error } = await supabase
        .from("établissements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur chargement établissements:", error);
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
      // Synchroniser localStorage avec la DB
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(dbList));
    } catch (error) {
      console.error("Erreur lors du chargement de la liste:", error);
    }
  };

  // Charger au montage
  useEffect(() => {
    const load = async () => {
      await loadEstablishmentsFromDb();
      setLoading(false);
    };
    load();
  }, []);

  // Écouter les mises à jour de la liste (après ajout depuis SaveEstablishmentButton)
  useEffect(() => {
    const onListUpdated = async () => {
      // Recharger depuis la DB pour être sûr d'avoir la vraie liste
      await loadEstablishmentsFromDb();
    };
    window.addEventListener(EVT_LIST_UPDATED, onListUpdated);
    return () => window.removeEventListener(EVT_LIST_UPDATED, onListUpdated);
  }, []);

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
      
      if (user) {
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

        // 2. Supprimer aussi de user_establishment si c'est celui-là
        await supabase
          .from("user_establishment")
          .delete()
          .eq("user_id", user.id)
          .eq("place_id", etab.place_id);

        // 3. Supprimer de establishments (compat)
        await supabase
          .from("establishments")
          .delete()
          .eq("user_id", user.id)
          .eq("place_id", etab.place_id);
      }

      // 4. Mettre à jour immédiatement l'état local (optimistic UI)
      const newList = establishments.filter(e => e.place_id !== etab.place_id);
      setEstablishments(newList);
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(newList));

      // 5. Si c'était l'établissement actif, le vider
      if (activeEstablishment?.place_id === etab.place_id) {
        localStorage.removeItem(STORAGE_KEY);
        setActiveEstablishment(null);
        window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: null }));
      }

      // 6. Dispatcher l'event pour synchroniser les autres composants
      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED, { detail: newList }));

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
            const isActive = activeEstablishment?.place_id === etab.place_id;
            const isDeleting = deletingPlaceId === etab.place_id;
            return (
              <div 
                key={etab.place_id} 
                className="relative"
              >
                {isActive && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                      <CheckCircle className="h-3 w-3" />
                      Actif
                    </span>
                  </div>
                )}
                <EstablishmentItem
                  etab={etab}
                  onSelect={handleSelectEstablishment}
                  onDelete={handleDeleteEstablishment}
                  isDeleting={isDeleting}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
