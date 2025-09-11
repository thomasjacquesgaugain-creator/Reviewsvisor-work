import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MapPin, Star, Clock, Phone, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  website?: string;
  phone?: string;
  rating?: number;
  user_ratings_total?: number;
  source: 'google-places';
}

interface GooglePlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const GooglePlaceAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Tapez le nom + ville (ex: Chez Guy Paris 11)",
  className = ""
}: GooglePlaceAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const sessionToken = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  
  const { toast } = useToast();

  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Charger l'API Google Maps
  useEffect(() => {
    if (!GOOGLE_API_KEY) {
      setApiError('Clé Google Maps manquante. Ajoutez VITE_GOOGLE_MAPS_API_KEY dans vos variables d\'environnement.');
      return;
    }

    const loadGoogleMapsApi = () => {
      if (window.google && window.google.maps) {
        initializeServices();
        return;
      }

      window.initGoogleMaps = () => {
        initializeServices();
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&language=fr&region=FR&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setApiError('Erreur de chargement de l\'API Google Maps. Vérifiez votre clé API.');
      };
      document.head.appendChild(script);
    };

    const initializeServices = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        
        // Créer un div temporaire pour PlacesService
        const tempDiv = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(tempDiv);
        
        setIsApiLoaded(true);
        setApiError('');
      }
    };

    loadGoogleMapsApi();

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [GOOGLE_API_KEY]);

  // Recherche avec debounce
  const searchPlaces = useCallback((query: string) => {
    if (!isApiLoaded || !autocompleteService.current || query.length < 2) {
      setSuggestions([]);
      setIsVisible(false);
      return;
    }

    setIsLoading(true);
    
    // Créer un nouveau token de session
    sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();

    const request = {
      input: query,
      types: ['establishment'],
      componentRestrictions: { country: 'FR' },
      sessionToken: sessionToken.current
    };

    autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: any) => {
      setIsLoading(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions.slice(0, 10));
        setIsVisible(true);
        setSelectedIndex(-1);
      } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        setSuggestions([]);
        setIsVisible(false);
      } else {
        console.error('Erreur AutocompleteService:', status);
        if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          setApiError('Accès refusé à l\'API Places. Vérifiez votre clé API et les restrictions.');
        }
        setSuggestions([]);
        setIsVisible(false);
      }
    });
  }, [isApiLoaded]);

  // Gestion de la saisie avec debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  // Récupérer les détails d'un lieu
  const getPlaceDetails = (placeId: string, description: string) => {
    if (!placesService.current) return;

    const request = {
      placeId,
      fields: [
        'place_id',
        'name', 
        'formatted_address',
        'geometry',
        'website',
        'international_phone_number',
        'rating',
        'user_ratings_total'
      ],
      sessionToken: sessionToken.current
    };

    placesService.current.getDetails(request, (place: any, status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const result: PlaceResult = {
          place_id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          },
          website: place.website,
          phone: place.international_phone_number,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          source: 'google-places'
        };

        onSelect(result);
        setSuggestions([]);
        setIsVisible(false);
        
        toast({
          title: "Établissement sélectionné",
          description: `${place.name} - ${place.formatted_address}`,
          duration: 3000
        });
      } else {
        console.error('Erreur PlacesService:', status);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les détails de l'établissement",
          variant: "destructive",
          duration: 3000
        });
      }
    });
  };

  // Sélectionner une suggestion
  const selectSuggestion = (suggestion: any) => {
    onChange(suggestion.description);
    getPlaceDetails(suggestion.place_id, suggestion.description);
  };

  // Navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isVisible || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsVisible(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Cacher les suggestions au clic extérieur
  useEffect(() => {
    const handleClickOutside = () => {
      setIsVisible(false);
      setSelectedIndex(-1);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (apiError) {
    return (
      <div className={className}>
        <Input
          disabled
          placeholder="Google Places non disponible"
          className="border-red-200"
        />
        <div className="text-sm text-red-600 mt-1">
          {apiError}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Pour activer Google Places, ajoutez VITE_GOOGLE_MAPS_API_KEY dans vos variables d'environnement.
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && setSuggestions.length > 0 && setIsVisible(true)}
          placeholder={!isApiLoaded ? "Chargement de Google Places..." : placeholder}
          disabled={!isApiLoaded}
          className="pr-10"
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        {isLoading && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isVisible && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg border bg-white">
          <div className="p-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id}
                className={`p-3 cursor-pointer rounded-md transition-colors ${
                  index === selectedIndex 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => selectSuggestion(suggestion)}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.structured_formatting?.main_text || suggestion.description}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {suggestion.structured_formatting?.secondary_text || suggestion.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isVisible && suggestions.length === 0 && !isLoading && value.length >= 2 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border bg-white">
          <div className="p-4 text-center text-gray-500">
            Aucun établissement trouvé
          </div>
        </Card>
      )}

      {value.length < 2 && value.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          Tapez au moins 2 caractères pour commencer la recherche
        </div>
      )}
    </div>
  );
};

export default GooglePlaceAutocomplete;