import { useEffect, useState } from "react";
import { Etab, STORAGE_KEY_LIST, STORAGE_KEY, EVT_LIST_UPDATED, EVT_SAVED } from "../types/etablissement";
import EstablishmentItem from "./EstablishmentItem";
import { Building2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function SavedEstablishmentsList() {
  const [establishments, setEstablishments] = useState<Etab[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEstablishment, setActiveEstablishment] = useState<Etab | null>(null);

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

  // Charger la liste au montage (depuis la table établissements)
  useEffect(() => {
    const loadEstablishments = async () => {
      try {
        // 1) Charger depuis localStorage en premier (source locale)
        const rawLocal = localStorage.getItem(STORAGE_KEY_LIST);
        let localList: Etab[] = [];
        if (rawLocal) {
          localList = JSON.parse(rawLocal);
          setEstablishments(localList);
        }

        // Helper: si une liste locale existe, elle fait foi (évite de "ressusciter" des éléments supprimés).
        const mergeLocalWithDb = (local: Etab[], db: Etab[]) => {
          if (local.length > 0) {
            const byPlaceId = new Map(db.map((e) => [e.place_id, e] as const));
            return local.map((l) => ({ ...(byPlaceId.get(l.place_id) || {}), ...l }));
          }
          return db;
        };

        // 2) Charger depuis la base de données si connecté
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!authError && user) {
          // Charger depuis la table "établissements" (français)
          const { data: etablissements, error } = await supabase
            .from("établissements")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!error) {
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

            const merged = mergeLocalWithDb(localList, dbList);

            setEstablishments(merged);
            localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(merged));
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
    
    // Scroll smooth vers le haut
    document.querySelector('[data-testid="card-mon-etablissement"]')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Fallback: si liste vide mais établissement actif, l'afficher
  const displayList = establishments.length > 0 
    ? establishments 
    : (activeEstablishment ? [activeEstablishment] : []);

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
      
      {displayList.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucun établissement enregistré pour le moment.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {displayList.map((etab) => {
            const isActive = activeEstablishment?.place_id === etab.place_id;
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
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}