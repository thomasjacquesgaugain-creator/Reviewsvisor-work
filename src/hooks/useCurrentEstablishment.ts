import { useState, useEffect } from "react";
import { STORAGE_KEY, EVT_SAVED } from "@/types/etablissement";

export interface CurrentEstablishment {
  id: string;
  name: string;
  place_id: string;
}

export function useCurrentEstablishment(): CurrentEstablishment | null {
  const [currentEstablishment, setCurrentEstablishment] = useState<CurrentEstablishment | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const establishment = JSON.parse(stored);
        return {
          id: establishment.place_id || establishment.id,
          name: establishment.name,
          place_id: establishment.place_id || establishment.id,
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const updateFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const establishment = JSON.parse(stored);
          setCurrentEstablishment({
            id: establishment.place_id || establishment.id,
            name: establishment.name,
            place_id: establishment.place_id || establishment.id,
          });
        } else {
          setCurrentEstablishment(null);
        }
      } catch (error) {
        console.error('Error reading current establishment from localStorage:', error);
        setCurrentEstablishment(null);
      }
    };

    // Initial load
    updateFromStorage();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        updateFromStorage();
      }
    };

    // Listen for custom events (when localStorage is updated from the same tab)
    const handleCustomEvent = () => {
      updateFromStorage();
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