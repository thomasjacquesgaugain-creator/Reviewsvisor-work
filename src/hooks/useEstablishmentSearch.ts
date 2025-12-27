import { useEffect, useRef, useState } from 'react';
import { loadGooglePlaces } from '@/lib/loadGooglePlaces';
import { supabase } from '@/integrations/supabase/client';

function getI18nLang(): string {
  const raw = (localStorage.getItem('i18nextLng') || navigator.language || 'en').trim();
  return raw.split('-')[0] || 'en';
}
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
  const [rawStatus, setRawStatus] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const sessionRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);
  const fallbackSessionRef = useRef<string>(Math.random().toString(36).slice(2) + Date.now().toString(36));

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
            sessionToken: sessionRef.current
          },
          async (predictions: any, status: string) => {
            setLoading(false);
            setRawStatus(status);

            const g = (window as any).google;
            const ok = status === g.maps.places.PlacesServiceStatus.OK;
            const zero = status === g.maps.places.PlacesServiceStatus.ZERO_RESULTS;

            // Log raw status so we can debug instantly
            if (!ok && !zero) {
              console.error('[Places] getPlacePredictions error', { status });
            }

            // If empty predictions, run a robust fallback via edge function (which itself falls back to Text Search)
            const shouldFallback = zero || (ok && (!predictions || predictions.length === 0));
            if (shouldFallback) {
              try {
                const lang = getI18nLang();
                const { data, error: fnError } = await supabase.functions.invoke('autocomplete-establishments', {
                  body: { input: q, sessionToken: fallbackSessionRef.current, lang }
                });

                if (fnError) throw fnError;

                const suggestions = (data as any)?.suggestions ?? [];
                const mapped = suggestions.map((s: any) => ({
                  place_id: s.place_id,
                  description: s.description,
                  structured_formatting: s.structured ?? s.structured_formatting,
                  __source: s.__source ?? 'fallback'
                }));

                setError(null);
                setResults(mapped);
                return;
              } catch (e: any) {
                console.error('[Places] fallback autocomplete-establishments failed', e);
                // No fallback available -> show empty results but keep dropdown logic in UI
                setError(null);
                setResults([]);
                return;
              }
            }

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
    rawStatus,
    resetSession: () => { 
      sessionRef.current = null;
      fallbackSessionRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
    } 
  };
}
