import React, { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

type Suggestion = {
  place_id: string;
  description: string;
  structured: {
    main_text: string;
    secondary_text: string;
  };
};

type PlaceDetails = {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    weekday_text: string[];
  };
  types: string[];
};

function useDebounce<T>(value: T, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

interface AutocompleteEtablissementProps {
  onPicked?: (place: PlaceDetails) => void;
}

export default function AutocompleteEtablissement({ onPicked }: AutocompleteEtablissementProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [sessionToken] = useState(() => Math.random().toString(36).substring(2));
  
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Recherche des suggestions d'autocomplétion
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setSuggestions([]);
      setError(null);
      return;
    }

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10000);
    
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const url = `https://zzjmtipdsccxmmoaetlp.supabase.co/functions/v1/autocomplete-establishments?input=${encodeURIComponent(debouncedQuery)}&sessionToken=${encodeURIComponent(sessionToken)}`;
        
        const res = await fetch(url, {
          method: 'GET',
          signal: ctrl.signal,
          headers: {
            'accept': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU'
          }
        });
        
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        clearTimeout(timeout);
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Erreur autocomplétion:', err);
          setError(err.name === 'AbortError' ? "Requête trop longue" : "Erreur lors de la recherche");
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
    
    return () => {
      ctrl.abort();
      clearTimeout(timeout);
    };
  }, [debouncedQuery, sessionToken]);

  // Fermer la liste si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Récupérer les détails d'un établissement
  const getPlaceDetails = async (placeId: string) => {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10000);
    
    setLoading(true);
    setError(null);
    
    try {
      const url = `https://zzjmtipdsccxmmoaetlp.supabase.co/functions/v1/get-place-details?placeId=${encodeURIComponent(placeId)}&sessionToken=${encodeURIComponent(sessionToken)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        headers: {
          'accept': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU'
        }
      });

      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result) {
        setSelectedPlace(data.result);
        onPicked?.(data.result);
      } else {
        setError(t("errors.noDetailsFound"));
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Erreur détails:', err);
        setError(err.name === 'AbortError' ? t("errors.requestTooLong") : t("errors.cannotRetrieveDetails"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.structured?.main_text || suggestion.description);
    setSuggestions([]);
    setHighlightedIndex(-1);
    getPlaceDetails(suggestion.place_id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setSuggestions([]);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="w-full space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {t("establishment.establishment")} <span className="text-red-500">*</span>
      </label>
      
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nom de votre établissement..."
          className="w-full"
          autoComplete="off"
        />
        
        {loading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {/* Liste des suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full text-left px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                  index === highlightedIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div className="font-medium text-gray-900">
                  {suggestion.structured?.main_text || suggestion.description}
                </div>
                {suggestion.structured?.secondary_text && (
                  <div className="text-sm text-gray-500">
                    {suggestion.structured.secondary_text}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {/* Affichage des détails de l'établissement sélectionné */}
      {selectedPlace && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-lg font-semibold text-gray-900">{selectedPlace.name}</div>
          <div className="text-sm text-gray-600 mt-1">{selectedPlace.formatted_address}</div>
          
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {selectedPlace.website && (
              <a 
                href={selectedPlace.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Site web
              </a>
            )}
            {selectedPlace.international_phone_number && (
              <span className="text-gray-600">
                {selectedPlace.international_phone_number}
              </span>
            )}
          </div>
          
          {typeof selectedPlace.rating === 'number' && (
            <div className="mt-2 text-sm text-gray-600">
              ⭐ {selectedPlace.rating}/5 ({selectedPlace.user_ratings_total} avis)
            </div>
          )}
        </div>
      )}
    </div>
  );
}