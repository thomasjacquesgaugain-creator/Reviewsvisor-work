import React, { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "../integrations/supabase/client";

type Suggestion = {
  description: string;
  place_id: string;
  structured?: { main_text?: string; secondary_text?: string };
};

type PlaceDetails = any;

function useDebounce<T>(v: T, d = 250) {
  const [val, setVal] = useState(v);
  useEffect(() => { const t = setTimeout(() => setVal(v), d); return () => clearTimeout(t); }, [v, d]);
  return val;
}

export default function AutocompleteEtablissementInline({
  onPicked,
}: { onPicked?: (details: PlaceDetails) => void }) {
  const [q, setQ] = useState("");
  const [list, setList] = useState<Suggestion[]>([]);
  const [hi, setHi] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const debounced = useDebounce(q, 250);
  const abortRef = useRef<AbortController | null>(null);
  const tokenRef = useRef<string>(Math.random().toString(36).slice(2) + Date.now().toString(36));
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Suggestions en temps réel
  useEffect(() => {
    if (!debounced.trim()) { 
      setList([]); 
      setErr(null); 
      return; 
    }
    
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setErr(null);

    supabase.functions
      .invoke('autocomplete-establishments', {
        body: { 
          input: debounced, 
          sessionToken: tokenRef.current 
        }
      })
      .then(({ data, error }) => {
        if (ctrl.signal.aborted) return;
        if (error) throw error;
        setList(data?.suggestions ?? []);
      })
      .catch(e => { 
        if (!ctrl.signal.aborted) {
          setErr("Erreur de suggestions");
          console.error('Autocomplete error:', e);
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
  }, [debounced]);

  // Fermer si clic extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => { 
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setList([]); 
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function getDetails(placeId: string) {
    setLoading(true);
    setErr(null);
    const usedToken = tokenRef.current;
    tokenRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
    
    supabase.functions
      .invoke('get-place-details', {
        body: { 
          placeId: placeId, 
          sessionToken: usedToken 
        }
      })
      .then(({ data, error }) => {
        if (error) throw error;
        onPicked?.(data?.result);
      })
      .catch((e) => {
        setErr("Erreur de récupération des détails");
        console.error('Place details error:', e);
      })
      .finally(() => setLoading(false));
  }

  function onSelect(s: Suggestion) {
    setQ(s.structured?.main_text || s.description);
    setList([]);
    setHi(-1);
    getDetails(s.place_id);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!list.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && hi >= 0) { e.preventDefault(); onSelect(list[hi]); }
    else if (e.key === "Escape") { setList([]); setHi(-1); }
  }

  return (
    <div className="relative" ref={boxRef}>
      {/* Groupe input + icône */}
      <div className="relative">
        {/* Icône loupe ou spinner fixée à gauche */}
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          {loading ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nom de votre établissement…"
          className="w-full rounded-2xl border border-border bg-background px-11 py-3 text-foreground placeholder:text-muted-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          autoComplete="off"
        />
      </div>

      {/* Menu des propositions — sous l'icône/champ */}
      {list.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-2xl border border-border bg-popover shadow-lg overflow-hidden">
          {list.map((s, i) => (
            <button
              key={s.place_id}
              type="button"
              onClick={() => onSelect(s)}
              onMouseEnter={() => setHi(i)}
              className={`flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-accent ${i === hi ? "bg-accent" : ""}`}
            >
              {/* Petite icône à gauche pour aligner "sous l'icône" */}
              <div className="mt-0.5">
                <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387-1.414 1.415-4.387-4.388zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {s.structured?.main_text || s.description}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.structured?.secondary_text || ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {loading && <div className="mt-2 text-xs text-muted-foreground">Chargement…</div>}
      {err && <div className="mt-2 text-xs text-destructive">{err}</div>}
    </div>
  );
}