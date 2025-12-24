import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, MapPin, Star, ExternalLink, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  searchEstablishments, 
  getPlaceDetails, 
  saveEstablishment,
  type PlacePrediction,
  type PlaceDetails 
} from '@/services/googlePlacesService';

interface SecureEstablishmentSearchProps {
  onSelect?: (place: PlaceDetails) => void;
  onSave?: (place: PlaceDetails) => void;
  placeholder?: string;
  showSaveButton?: boolean;
  className?: string;
}

export function SecureEstablishmentSearch({
  onSelect,
  onSave,
  placeholder = "Rechercher un établissement...",
  showSaveButton = true,
  className = "",
}: SecureEstablishmentSearchProps) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const sessionTokenRef = useRef<string>(crypto.randomUUID());
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchEstablishments(searchQuery, sessionTokenRef.current);
      sessionTokenRef.current = result.sessionToken;
      setPredictions(result.predictions);
      setShowDropdown(result.predictions.length > 0);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur de recherche');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Input change handler with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedPlace(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  // Select a prediction
  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setShowDropdown(false);
    setQuery(prediction.description);
    setPredictions([]);
    setIsLoadingDetails(true);

    try {
      const details = await getPlaceDetails(prediction.place_id);
      setSelectedPlace(details);
      
      // Reset session token after successful place selection
      sessionTokenRef.current = crypto.randomUUID();
      
      onSelect?.(details);
    } catch (error) {
      console.error('Error getting place details:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la récupération des détails');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Save establishment
  const handleSave = async () => {
    if (!selectedPlace) return;

    setIsSaving(true);
    try {
      await saveEstablishment(selectedPlace);
      toast.success(`${selectedPlace.name} enregistré avec succès !`);
      onSave?.(selectedPlace);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : predictions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < predictions.length) {
          handleSelectPrediction(predictions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {(isSearching || isLoadingDetails) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Predictions Dropdown */}
      {showDropdown && predictions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg max-h-64 overflow-auto">
          <CardContent className="p-0">
            {predictions.map((prediction, index) => (
              <button
                key={prediction.place_id}
                onClick={() => handleSelectPrediction(prediction)}
                className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0 ${
                  index === highlightedIndex ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{prediction.main_text}</p>
                    <p className="text-xs text-muted-foreground">{prediction.secondary_text}</p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Place Details */}
      {selectedPlace && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{selectedPlace.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedPlace.address}
                </p>
                
                {selectedPlace.rating && (
                  <p className="text-sm flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    {selectedPlace.rating.toFixed(1)}
                    {selectedPlace.user_ratings_total && (
                      <span className="text-muted-foreground">
                        ({selectedPlace.user_ratings_total} avis)
                      </span>
                    )}
                  </p>
                )}

                {selectedPlace.phone && (
                  <p className="text-sm text-muted-foreground">{selectedPlace.phone}</p>
                )}

                {selectedPlace.website && (
                  <a 
                    href={selectedPlace.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Site web
                  </a>
                )}
              </div>

              {showSaveButton && (
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
