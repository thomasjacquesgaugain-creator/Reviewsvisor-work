import { useEffect, useState } from "react";
import { Etab, STORAGE_KEY, EVT_SAVED } from "@/types/etablissement";

export interface CurrentEstablishment {
  id: string;
  name: string;
  place_id: string;
}

export function useCurrentEstablishment(): CurrentEstablishment | null {
  const [currentEtab, setCurrentEtab] = useState<Etab | null>(null);

  useEffect(() => {
    // Load from localStorage initially
    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          setCurrentEtab(JSON.parse(raw));
        } else {
          setCurrentEtab(null);
        }
      } catch {
        setCurrentEtab(null);
      }
    };

    loadFromStorage();

    // Listen for changes when establishment is saved
    const onSaved = (e: any) => setCurrentEtab(e.detail as Etab);
    window.addEventListener(EVT_SAVED, onSaved);

    return () => window.removeEventListener(EVT_SAVED, onSaved);
  }, []);

  if (!currentEtab) {
    return null;
  }
  
  return {
    id: currentEtab.place_id, // Using place_id as the unique identifier
    name: currentEtab.name,
    place_id: currentEtab.place_id,
  };
}