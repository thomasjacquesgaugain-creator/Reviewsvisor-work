import { useEffect, useRef, useState } from 'react';
import { loadGooglePlaces } from '@/lib/loadGooglePlaces';

function mapPlacesStatus(status: string, errorMessage?: string): string | null {
  const g = (window as any).google;
  if (!g?.maps?.places) return 'Google Places non chargé';
  
  switch (status) {
    case g.maps.places.PlacesServiceStatus.OK:
    case g.maps.places.PlacesServiceStatus.ZERO_RESULTS:
      return null;
    case g.maps.places.PlacesServiceStatus.REQUEST_DENIED:
      return 'Clé Google invalide ou non autorisée (référents/API).';
    case g.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
      return 'Quota dépassé. Réessayez plus tard.';
    case g.maps.places.PlacesServiceStatus.INVALID_REQUEST:
      return 'Requête invalide (paramètre manquant).';
    default:
      return errorMessage || status || 'Erreur inconnue Google Places';
  }
}

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
            
            const err = mapPlacesStatus(status);
            if (err) {
              setError(err);
              setResults([]);
            } else {
              setError(null);
              setResults(predictions ?? []);
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
