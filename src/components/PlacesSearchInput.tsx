import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Loader2, Search, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PlaceItem {
  place_id: string;
  name: string;
  formatted_address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  website?: string;
  phone?: string;
  source: string;
}

interface PlacesSearchInputProps {
  onSelect?: (place: PlaceItem) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

// Custom debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const PlacesSearchInput: React.FC<PlacesSearchInputProps> = ({
  onSelect,
  placeholder = "Rechercher un établissement... (ex: Chez Guy Paris 11)",
  value: controlledValue,
  onChange: controlledOnChange
}) => {
  const [inputValue, setInputValue] = useState(controlledValue || '');
  const [suggestions, setSuggestions] = useState<PlaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Debounce the search query
  const debouncedQuery = useDebounce(inputValue, 300);

  // Handle controlled vs uncontrolled component
  const displayValue = controlledValue !== undefined ? controlledValue : inputValue;
  const handleValueChange = (newValue: string) => {
    if (controlledOnChange) {
      controlledOnChange(newValue);
    } else {
      setInputValue(newValue);
    }
  };

  // Search for places
  const searchPlaces = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('places-search', {
        body: { q: query }
      });

      if (error) {
        console.error('Error searching places:', error);
        toast({
          title: "Erreur de recherche",
          description: "Impossible d'effectuer la recherche. Vérifiez votre connexion.",
          variant: "destructive",
        });
        setSuggestions([]);
        return;
      }

      if (data?.error) {
        if (data.code === 'REQUEST_DENIED') {
          toast({
            title: "API non autorisée",
            description: "L'API Google Places n'est pas activée. Veuillez vérifier la configuration.",
            variant: "destructive",
          });
        } else if (data.code === 'OVER_QUERY_LIMIT') {
          toast({
            title: "Quota dépassé",
            description: "Limite de recherche atteinte. Veuillez réessayer plus tard.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur de recherche",
            description: data.error || "Une erreur s'est produite lors de la recherche.",
            variant: "destructive",
          });
        }
        setSuggestions([]);
        return;
      }

      const places = data?.items || [];
      setSuggestions(places);
      setShowSuggestions(places.length > 0);

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      searchPlaces(debouncedQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle selecting a place
  const handleSelect = (place: PlaceItem) => {
    handleValueChange(place.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    if (onSelect) {
      onSelect(place);
    }
    toast({
      title: "Établissement sélectionné",
      description: `${place.name} a été sélectionné`,
    });
  };

  // Handle URL search
  const handleUrlSearch = async () => {
    if (!inputValue || !inputValue.includes('maps.google')) {
      toast({
        title: "URL invalide",
        description: "Veuillez coller une URL Google Maps valide",
        variant: "destructive",
      });
      return;
    }

    await searchPlaces(inputValue);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={displayValue}
            onChange={(e) => {
              handleValueChange(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex items-center gap-2"
        >
          <LinkIcon className="h-4 w-4" />
          URL
        </Button>
      </div>

      {showUrlInput && (
        <div className="mt-2 p-3 border rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">
            Collez l'URL Google Maps de votre établissement :
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://maps.google.com/..."
              value={inputValue}
              onChange={(e) => handleValueChange(e.target.value)}
            />
            <Button onClick={handleUrlSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
            </Button>
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {suggestions.map((place, index) => (
            <div
              key={place.place_id}
              className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSelect(place)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {place.name}
                  </h4>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <p className="text-sm text-gray-500 truncate">
                      {place.formatted_address}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {place.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">
                          {place.rating.toFixed(1)}
                        </span>
                        {place.user_ratings_total && (
                          <span className="text-xs text-gray-500">
                            ({place.user_ratings_total})
                          </span>
                        )}
                      </div>
                    )}
                    {place.business_status && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        place.business_status === 'OPERATIONAL' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {place.business_status === 'OPERATIONAL' ? 'Ouvert' : 'Fermé'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && !isLoading && debouncedQuery && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-gray-500 text-center">
            Aucun établissement trouvé pour "{debouncedQuery}"
          </p>
        </div>
      )}
    </div>
  );
};

export default PlacesSearchInput;