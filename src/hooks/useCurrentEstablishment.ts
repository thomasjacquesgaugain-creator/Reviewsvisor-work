import { useState, useEffect } from "react";

export interface CurrentEstablishment {
  id: string;
  name: string;
  place_id: string;
}

export function useCurrentEstablishment(): CurrentEstablishment | null {
  const [currentEstablishment, setCurrentEstablishment] = useState<CurrentEstablishment | null>(null);

  useEffect(() => {
    const updateFromStorage = () => {
      try {
        const stored = localStorage.getItem('current-establishment');
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
      if (e.key === 'current-establishment') {
        updateFromStorage();
      }
    };

    // Listen for custom events (when localStorage is updated from the same tab)
    const handleCustomEvent = () => {
      updateFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('current-establishment-updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('current-establishment-updated', handleCustomEvent);
    };
  }, []);

  return currentEstablishment;
}