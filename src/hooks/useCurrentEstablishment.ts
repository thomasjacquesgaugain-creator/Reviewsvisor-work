import { useState, useEffect } from "react";
import { STORAGE_KEY, EVT_SAVED } from "@/types/etablissement";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentEstablishment {
  id: string;
  name: string;
  place_id: string;
}

export function useCurrentEstablishment(): CurrentEstablishment | null {
  const [currentEstablishment, setCurrentEstablishment] = useState<CurrentEstablishment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEstablishment = async () => {
      try {
        // 1. D'abord vérifier localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const establishment = JSON.parse(stored);
          setCurrentEstablishment({
            id: establishment.place_id || establishment.id,
            name: establishment.name,
            place_id: establishment.place_id || establishment.id,
          });
          setLoading(false);
          return;
        }

        // 2. Si localStorage est vide, récupérer depuis Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setCurrentEstablishment(null);
          setLoading(false);
          return;
        }

        // Récupérer le profil avec current_establishment_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_establishment_id')
          .eq('user_id', session.user.id)
          .single();

        if (profile?.current_establishment_id) {
          // Récupérer l'établissement
          const { data: establishment } = await supabase
            .from('establishments')
            .select('id, name, place_id')
            .eq('id', profile.current_establishment_id)
            .single();

          if (establishment) {
            const estab = {
              id: establishment.id,
              name: establishment.name,
              place_id: establishment.place_id,
            };
            // Sauvegarder dans localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(estab));
            setCurrentEstablishment(estab);
          }
        } else {
          // Pas de current_establishment_id, essayer de récupérer le premier établissement de l'utilisateur
          const { data: establishments } = await supabase
            .from('establishments')
            .select('id, name, place_id')
            .eq('user_id', session.user.id)
            .limit(1);

          if (establishments && establishments.length > 0) {
            const estab = {
              id: establishments[0].id,
              name: establishments[0].name,
              place_id: establishments[0].place_id,
            };
            // Sauvegarder dans localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(estab));
            // Mettre à jour le profil avec cet établissement
            await supabase
              .from('profiles')
              .update({ current_establishment_id: establishments[0].id })
              .eq('user_id', session.user.id);
            setCurrentEstablishment(estab);
          }
        }
      } catch (error) {
        console.error('Error loading establishment:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEstablishment();

    // Écouter les changements de localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadEstablishment();
      }
    };

    const handleCustomEvent = () => {
      loadEstablishment();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(EVT_SAVED, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(EVT_SAVED, handleCustomEvent as EventListener);
    };
  }, []);

  return currentEstablishment;
}