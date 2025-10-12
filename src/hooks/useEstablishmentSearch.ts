import { useEffect, useRef, useState } from 'react';
import { loadGooglePlaces } from '@/lib/loadGooglePlaces';

export function useEstablishmentSearch() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const sessionRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        await loadGooglePlaces();
        
        const g = (window as any).google;
        if (!sessionRef.current) {
          sessionRef.current = new g.maps.places.AutocompleteSessionToken();
        }

        const service = new g.maps.places.AutocompleteService();
        
        service.getPlacePredictions(
          {
            input: q,
            types: ['establishment'],
            componentRestrictions: { country: 'fr' },
            sessionToken: sessionRef.current
          },
          (predictions: any, status: string) => {
            setLoading(false);
            
            if (status === g.maps.places.PlacesServiceStatus.OK) {
              setResults(predictions ?? []);
            } else if (status === g.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              setResults([]);
            } else if (status === g.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
              setError('Clé Google invalide ou non autorisée. Vérifiez VITE_GOOGLE_MAPS_BROWSER_KEY et ses restrictions.');
            } else {
              setError(status);
            }
          }
        );
      } catch (e: any) {
        setLoading(false);
        setError(e?.message ?? 'Erreur de recherche');
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  return { 
    q, 
    setQ, 
    results, 
    loading, 
    error, 
    resetSession: () => { sessionRef.current = null; } 
  };
}
