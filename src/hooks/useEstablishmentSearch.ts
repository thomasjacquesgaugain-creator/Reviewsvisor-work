import { useEffect, useRef, useState } from "react";
import { makePlacesUrls, PlacePrediction } from "@/utils/placesClient";

export function useEstablishmentSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const sessionRef = useRef<string>();
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
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
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU'
          }
        });

        clearTimeout(timeout);
        const data = await r.json();

        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

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
