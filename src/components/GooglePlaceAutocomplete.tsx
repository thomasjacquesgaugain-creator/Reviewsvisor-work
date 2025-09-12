import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader as LoaderIcon, MapPin } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { loadGoogleMaps } from '@/lib/loadGoogleMaps';

// Interface pour le résultat d'un lieu Google
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

// Variables globales pour les services Google Maps
let autocompleteService: any = null;
let placesService: any = null;

// Fonction pour initialiser les services Google Maps
const initializeGoogleMapsServices = async () => {
  try {
    const g = await loadGoogleMaps();
    
    if (!autocompleteService) {
      autocompleteService = new g.maps.places.AutocompleteService();
    }
    
    if (!placesService) {
      // Créer un div temporaire pour PlacesService
      const div = document.createElement('div');
      placesService = new g.maps.places.PlacesService(div);
    }
    
    return { autocompleteService, placesService };
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des services Google Maps:', error);
    throw error;
  }
};

// Fonction de debounce simple
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
}

const GooglePlaceAutocomplete: React.FC<GooglePlaceAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Tapez le nom + ville (ex: McDonald's Châtelet Paris)",
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [apiError, setApiError] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<any>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Créer un nouveau token de session
  const createNewSessionToken = async () => {
    try {
      const g = await loadGoogleMaps();
      return new g.maps.places.AutocompleteSessionToken();
    } catch (error) {
      return null;
    }
  };

  // Rechercher des lieux avec debounce
  const searchPlaces = useRef(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const services = await initializeGoogleMapsServices();
        
        // Créer un nouveau token de session si nécessaire
        if (!sessionToken) {
          const newToken = await createNewSessionToken();
          setSessionToken(newToken);
        }
        
        const request = {
          input: query,
          types: ['establishment'],
          componentRestrictions: { country: 'FR' },
          sessionToken: sessionToken
        };

        services.autocompleteService.getPlacePredictions(
          request,
          (predictions: any, status: any) => {
            setIsLoading(false);
            console.debug('Places API status:', status, 'predictions count:', predictions?.length || 0);
            
            if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions.slice(0, 10));
              setShowSuggestions(true);
              setSelectedIndex(-1);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
              if (status !== (window as any).google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                console.error('Erreur lors de la recherche:', status);
              }
            }
          }
        );
      } catch (error) {
        setIsLoading(false);
        setSuggestions([]);
        setShowSuggestions(false);
        console.error('Erreur lors de la recherche de lieux:', error);
        if (error instanceof Error && error.message.includes('VITE_GOOGLE_MAPS_API_KEY')) {
          setApiError('Clé Google Maps manquante, mettez VITE_GOOGLE_MAPS_API_KEY dans .env');
          toast({
            variant: "destructive",
            title: "Clé Google Maps manquante",
            description: "Mettez VITE_GOOGLE_MAPS_API_KEY dans votre fichier .env"
          });
        }
      }
    }, 300)
  ).current;

  // Gestion de la saisie
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchPlaces(newValue);
  };

  // Récupérer les détails d'un lieu
  const getPlaceDetails = async (placeId: string, description: string) => {
    try {
      const services = await initializeGoogleMapsServices();
      
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
        sessionToken: sessionToken
      };

      services.placesService.getDetails(request, (place: any, status: any) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
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
          setShowSuggestions(false);
          setSuggestions([]);
          
          // Créer un nouveau token de session pour la prochaine recherche
          createNewSessionToken().then(setSessionToken);
          
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
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
    }
  };

  // Sélectionner une suggestion
  const selectSuggestion = (suggestion: any) => {
    onChange(suggestion.description);
    getPlaceDetails(suggestion.place_id, suggestion.description);
  };

  // Navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Cacher les suggestions au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Gestion des erreurs API
  if (apiError) {
    return (
      <div className={className}>
        <Input
          disabled
          placeholder="Google Places non disponible"
          className="border-destructive"
        />
        <div className="text-sm text-destructive mt-1">
          {apiError}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length >= 2 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="pr-10"
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        {isLoading && (
          <LoaderIcon className="absolute right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto shadow-lg z-[1000] bg-background border">
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id}
                className={`px-4 py-3 cursor-pointer hover:bg-muted border-b border-border last:border-b-0 ${
                  index === selectedIndex ? 'bg-accent' : ''
                }`}
                onClick={() => selectSuggestion(suggestion)}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="font-medium text-foreground">
                  {suggestion.structured_formatting?.main_text || suggestion.description}
                </div>
                <div className="text-sm text-muted-foreground">
                  {suggestion.structured_formatting?.secondary_text || ''}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showSuggestions && suggestions.length === 0 && !isLoading && value.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-1 shadow-lg z-[1000] bg-background border">
          <CardContent className="p-4 text-center text-muted-foreground">
            Aucun résultat trouvé
          </CardContent>
        </Card>
      )}

      {value.length > 0 && value.length < 2 && (
        <div className="text-xs text-muted-foreground mt-1">
          Tapez au moins 2 caractères pour commencer la recherche
        </div>
      )}
    </div>
  );
};

export default GooglePlaceAutocomplete;