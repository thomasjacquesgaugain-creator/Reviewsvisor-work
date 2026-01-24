import { useState, useEffect } from "react";
import { STORAGE_KEY, EVT_SAVED } from "@/types/etablissement";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentEstablishment {
  id: string;
  name: string;
  place_id: string;
}

export function useCurrentEstablishment(): { establishment: CurrentEstablishment | null; loading: boolean } {
  const [currentEstablishment, setCurrentEstablishment] = useState<CurrentEstablishment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEstablishment = async () => {
      try {
        // 1. Récupérer la session utilisateur d'abord
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Pas de session, nettoyer localStorage et retourner null
          localStorage.removeItem(STORAGE_KEY);
          setCurrentEstablishment(null);
          setLoading(false);
          return;
        }

        // 2. Vérifier localStorage, mais VALIDER que l'établissement appartient à l'utilisateur actuel
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const establishment = JSON.parse(stored);
            const placeId = establishment.place_id || establishment.id;
            
            // Vérifier que cet établissement appartient bien à l'utilisateur actuel
            // Essayer d'abord dans établissements (table principale)
            let validEstablishment = null;
            const { data: etabData } = await supabase
              .from('établissements')
              .select('id, place_id, nom')
              .eq('place_id', placeId)
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (etabData) {
              validEstablishment = {
                id: etabData.id,
                name: etabData.nom,
                place_id: etabData.place_id,
              };
            } else {
              // Fallback: vérifier dans establishments
              const { data: estabData } = await supabase
                .from('establishments')
                .select('id, name, place_id')
                .eq('place_id', placeId)
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (estabData) {
                validEstablishment = {
                  id: estabData.id,
                  name: estabData.name,
                  place_id: estabData.place_id,
                };
              }
            }

            if (validEstablishment) {
              // L'établissement est valide, l'utiliser
              const estab = {
                id: validEstablishment.id,
                name: validEstablishment.name,
                place_id: validEstablishment.place_id,
              };
              setCurrentEstablishment(estab);
              setLoading(false);
              return;
            } else {
              // L'établissement dans localStorage n'appartient pas à cet utilisateur, le supprimer
              console.warn('Établissement dans localStorage n\'appartient pas à l\'utilisateur actuel, suppression...');
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch (parseError) {
            // Erreur de parsing, nettoyer localStorage
            console.error('Erreur parsing localStorage:', parseError);
            localStorage.removeItem(STORAGE_KEY);
          }
        }

        // Récupérer le profil avec current_establishment_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_establishment_id')
          .eq('user_id', session.user.id)
          .single();

        if (profile?.current_establishment_id) {
          // Récupérer l'établissement depuis établissements (table principale)
          let establishment = null;
          const { data: etabData } = await supabase
            .from('établissements')
            .select('id, place_id, nom')
            .eq('id', profile.current_establishment_id)
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (etabData) {
            establishment = {
              id: etabData.id,
              name: etabData.nom,
              place_id: etabData.place_id,
            };
          } else {
            // Fallback: vérifier dans establishments
            const { data: estabData } = await supabase
              .from('establishments')
              .select('id, name, place_id')
              .eq('id', profile.current_establishment_id)
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (estabData) {
              establishment = {
                id: estabData.id,
                name: estabData.name,
                place_id: estabData.place_id,
              };
            }
          }

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
          // Essayer d'abord dans établissements (table principale)
          let establishments = null;
          const { data: etabsData } = await supabase
            .from('établissements')
            .select('id, place_id, nom')
            .eq('user_id', session.user.id)
            .order('updated_at', { ascending: false })
            .limit(1);
          
          if (etabsData && etabsData.length > 0) {
            establishments = etabsData.map(e => ({
              id: e.id,
              name: e.nom,
              place_id: e.place_id,
            }));
          } else {
            // Fallback: vérifier dans establishments
            const { data: estabsData } = await supabase
              .from('establishments')
              .select('id, name, place_id')
              .eq('user_id', session.user.id)
              .limit(1);
            
            if (estabsData) {
              establishments = estabsData.map(e => ({
                id: e.id,
                name: e.name,
                place_id: e.place_id,
              }));
            }
          }

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

  return { establishment: currentEstablishment, loading };
}