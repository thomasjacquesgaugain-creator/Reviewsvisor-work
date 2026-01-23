import { useState, useEffect } from "react";
import { STORAGE_KEY, EVT_SAVED } from "@/types/etablissement";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentEstablishment } from "@/services/establishments";

export interface CurrentEstablishment {
  id: string;
  name: string;
  place_id: string;
}

export function useCurrentEstablishment(): CurrentEstablishment | null {
  const [currentEstablishment, setCurrentEstablishment] = useState<CurrentEstablishment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier que l'établissement appartient à l'utilisateur connecté
  useEffect(() => {
    const verifyAndLoadEstablishment = async () => {
      setIsLoading(true);
      try {
        // Vérifier que l'utilisateur est connecté
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          // Utilisateur non connecté : nettoyer le localStorage
          localStorage.removeItem(STORAGE_KEY);
          setCurrentEstablishment(null);
          setIsLoading(false);
          return;
        }

        // Récupérer l'établissement depuis la base de données (source de vérité)
        const establishment = await getCurrentEstablishment();
        
        if (establishment) {
          // Vérifier que l'établissement appartient bien à l'utilisateur
          const { data: verification, error: verifyError } = await supabase
            .from('establishments')
            .select('id, place_id, name, user_id')
            .eq('id', establishment.id)
            .eq('user_id', user.id)
            .single();

          if (verifyError || !verification) {
            // L'établissement n'appartient pas à l'utilisateur : nettoyer le localStorage
            console.warn('Establishment does not belong to current user, clearing localStorage');
            localStorage.removeItem(STORAGE_KEY);
            setCurrentEstablishment(null);
            setIsLoading(false);
            return;
          }

          // L'établissement est valide : mettre à jour le state et le localStorage
          const establishmentData: CurrentEstablishment = {
            id: establishment.place_id || establishment.id,
            name: establishment.name,
            place_id: establishment.place_id || establishment.id,
          };
          
          setCurrentEstablishment(establishmentData);
          
          // Synchroniser le localStorage avec la base de données
          const storedData = {
            place_id: establishment.place_id,
            id: establishment.id,
            name: establishment.name,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
        } else {
          // Aucun établissement trouvé : nettoyer le localStorage
          localStorage.removeItem(STORAGE_KEY);
          setCurrentEstablishment(null);
        }
      } catch (error) {
        console.error('Error verifying current establishment:', error);
        // En cas d'erreur, nettoyer le localStorage par sécurité
        localStorage.removeItem(STORAGE_KEY);
        setCurrentEstablishment(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndLoadEstablishment();

    // Écouter les changements de localStorage (depuis d'autres onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        verifyAndLoadEstablishment();
      }
    };

    // Écouter les événements personnalisés (mise à jour depuis le même onglet)
    const handleCustomEvent = () => {
      verifyAndLoadEstablishment();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(EVT_SAVED, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(EVT_SAVED, handleCustomEvent as EventListener);
    };
  }, []);

  // Pendant le chargement, retourner null pour éviter d'afficher un établissement incorrect
  if (isLoading) {
    return null;
  }

  return currentEstablishment;
}