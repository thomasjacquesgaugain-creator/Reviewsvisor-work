import { useEffect, useRef, useState } from "react";
import { makePlacesUrls, PlacePrediction } from "@/utils/placesClient";
import { authHeaders, checkSupabaseConfig } from "@/lib/supabaseClient";

export function useEstablishmentSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const sessionRef = useRef<string>();
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    // Vérification de la config Supabase
    const configCheck = checkSupabaseConfig();
    if (!configCheck.valid) {
      setError(configCheck.error!);
      setLoading(false);
      return;
    }

    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const { auto, token } = makePlacesUrls(q, undefined, sessionRef.current);
        sessionRef.current = token;
        const timeout = setTimeout(() => abortRef.current?.abort(), 10000);

        const r = await fetch(auto, {
          method: "GET",
          signal: abortRef.current.signal,
          headers: await authHeaders()
        });

        clearTimeout(timeout);
        const data = await r.json();

        if (!r.ok) {
          // Détection spécifique des erreurs d'authentification
          if ((r.status === 401 || r.status === 403) && 
              (data?.error?.toLowerCase().includes('api key') || 
               data?.error?.toLowerCase().includes('invalid') ||
               data?.message?.toLowerCase().includes('api key'))) {
            throw new Error('Clé Supabase (anon) invalide. Mettez à jour VITE_SUPABASE_ANON_KEY dans Security.');
          }
          throw new Error(data?.error || `HTTP ${r.status}`);
        }

        const status = data?.status;
        if (status && status !== "OK" && status !== "ZERO_RESULTS") {
          throw new Error(data?.error_message || status);
        }

        setResults(data?.predictions ?? []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Erreur de recherche");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  return { q, setQ, results, loading, error };
}
