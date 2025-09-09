import React, { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "../integrations/supabase/client";

type Item = {
  id: string;
  label: string;
  secondary?: string;
  siret?: string | null;
  siren?: string | null;
  commune?: string | null;
  code_postal?: string | null;
};

function useDebounce<T>(v: T, d = 250) {
  const [val, setVal] = useState(v);
  useEffect(() => { const t = setTimeout(() => setVal(v), d); return () => clearTimeout(t); }, [v, d]);
  return val;
}

export default function AutocompleteEtablissementsFR({
  onPicked,
}: { onPicked?: (item: Item) => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [hi, setHi] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const debounced = useDebounce(q, 250);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!debounced.trim()) { setItems([]); setErr(null); return; }
    let aborted = false;
    setLoading(true);
    setErr(null);
    
    supabase.functions.invoke('autocomplete-etablissements-fr', {
      body: { q: debounced }
    })
      .then(({ data, error }) => {
        if (!aborted) {
          if (error) {
            console.error('Supabase function error:', error)
            setErr("Erreur de recherche")
          } else {
            setItems(data?.items || [])
          }
        }
      })
      .catch(e => { 
        console.error('Request error:', e)
        if (!aborted) setErr("Erreur de recherche"); 
      })
      .finally(() => { if (!aborted) setLoading(false); });
      
    return () => { aborted = true; };
  }, [debounced]);

  // fermer au clic extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setItems([]);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function select(it: Item) {
    setQ(it.label);
    setItems([]);
    setHi(-1);
    onPicked?.(it);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && hi >= 0) { e.preventDefault(); select(items[hi]); }
    else if (e.key === "Escape") { setItems([]); setHi(-1); }
  }

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
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
          className="w-full rounded-2xl border px-11 py-3 shadow-sm outline-none focus:ring-2"
          autoComplete="off"
        />
      </div>

      {items.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-2xl border bg-white shadow-lg overflow-hidden">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => select(it)}
              onMouseEnter={() => setHi(i)}
              className={`flex w-full items-start px-3 py-2 text-left hover:bg-gray-50 ${i === hi ? "bg-gray-100" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">{it.label}</div>
                <div className="text-xs text-muted-foreground truncate">{it.secondary}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {err && <div className="mt-2 text-xs text-destructive">{err}</div>}
    </div>
  );
}