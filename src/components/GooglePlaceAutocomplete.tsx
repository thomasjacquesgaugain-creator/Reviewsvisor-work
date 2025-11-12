import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader as LoaderIcon, MapPin } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { loadGoogleMaps } from '@/lib/loadGoogleMaps';
import { saveEstablishmentFromPlaceId } from '@/services/establishments';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
  source?: string;
}

interface GooglePlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
  onEstablishmentSaved?: (establishment: any) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

// Services Google Maps globaux
let autocompleteService: any = null;
let placesService: any = null;

// Initialisation des services Google Maps
async function initializeGoogleMapsServices() {
  if (autocompleteService && placesService) {
    return { autocompleteService, placesService };
  }

  try {
    await loadGoogleMaps();
    
    if (!(window as any).google?.maps?.places) {
      throw new Error('Google Places API not loaded');
    }

    autocompleteService = new (window as any).google.maps.places.AutocompleteService();
    placesService = new (window as any).google.maps.places.PlacesService(document.createElement('div'));
    
    console.debug('Google Maps services initialized successfully');
    return { autocompleteService, placesService };
  } catch (error) {
    console.error('Failed to initialize Google Maps services:', error);
    throw error;
  }
}

// Fonction debounce générique
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
}

export default function GooglePlaceAutocomplete({ 
  value, 
  onChange, 
  onSelect, 
  onEstablishmentSaved,
  placeholder = "Rechercher un lieu...",
  className = "",
  id
}: GooglePlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [sessionToken, setSessionToken] = useState<any>(null);
  const [services, setServices] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialiser les services Google Maps au montage
  useEffect(() => {
    let isMounted = true;
    
    const initServices = async () => {
      try {
        const initializedServices = await initializeGoogleMapsServices();
        if (isMounted) {
          setServices(initializedServices);
          setApiError(null);
          // Créer le premier token de session
          createNewSessionToken().then(token => {
            if (isMounted) setSessionToken(token);
          });
        }
      } catch (error) {
        console.error('Erreur d\'initialisation des services Google Maps:', error);
        if (isMounted) {
          if (error instanceof Error && error.message.includes('VITE_GOOGLE_MAPS_API_KEY')) {
            setApiError('Clé API Google Maps manquante. Veuillez configurer VITE_GOOGLE_MAPS_API_KEY.');
          } else {
            setApiError('Erreur de chargement de Google Maps. Vérifiez VITE_GOOGLE_MAPS_BROWSER_KEY/VITE_GOOGLE_MAPS_API_KEY et les restrictions de domaines.');
          }
        }
      }
    };

    initServices();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Créer un nouveau token de session
  const createNewSessionToken = async (): Promise<any> => {
    try {
      await loadGoogleMaps();
      return new (window as any).google.maps.places.AutocompleteSessionToken();
    } catch (error) {
      console.error('Erreur lors de la création du token de session:', error);
      return null;
    }
  };

  // Recherche de lieux avec debounce
  const searchPlaces = debounce(async (query: string) => {
    if (!query.trim() || !services?.autocompleteService || !sessionToken) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const request = {
        input: query,
        componentRestrictions: { country: 'fr' },
        language: 'fr',
        sessionToken: sessionToken,
        types: ['establishment']
      };

      services.autocompleteService.getPlacePredictions(request, (predictions: any[], status: any) => {
        setIsLoading(false);
        
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } else if (status === (window as any).google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setSuggestions([]);
          setShowSuggestions(false);
        } else {
          console.error('Erreur AutocompleteService:', status);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, 300);

  // Gérer les changements de l'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchPlaces(newValue);
  };

  // Récupérer les détails d'un lieu
  const getPlaceDetails = async (placeId: string, displayName: string) => {
    if (!services?.placesService) {
      console.error('PlacesService non disponible');
      return;
    }

    try {
      const request = {
        placeId: placeId,
        fields: [
          'place_id',
          'name', 
          'formatted_address',
          'geometry.location',
          'international_phone_number',
          'website',
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
  const selectSuggestion = async (suggestion: any) => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour sélectionner un établissement",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setIsSaving(true);
    
    // Récupérer d'abord les détails complets depuis Google Places
    if (!services?.placesService) {
      console.error('PlacesService non disponible');
      setIsSaving(false);
      return;
    }

    try {
      const request = {
        placeId: suggestion.place_id,
        fields: [
          'place_id',
          'name', 
          'formatted_address',
          'geometry.location',
          'international_phone_number',
          'website',
          'rating',
          'user_ratings_total'
        ],
        sessionToken: sessionToken
      };

      services.placesService.getDetails(request, async (place: any, status: any) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
          // Afficher "Nom — Adresse" dans l'input de recherche
          const displayLabel = [place.name, place.formatted_address].filter(Boolean).join(" — ");
          onChange(displayLabel);
          
          try {
            // Call saveSelectedPlace with the place_id
            const { saveSelectedPlace } = await import('@/services/establishments');
            await saveSelectedPlace(suggestion.place_id);
            
            // Also save venue to get establishment data for the form
            const { saveVenueFromPlaceId } = await import('@/services/establishments');
            const savedEstablishment = await saveVenueFromPlaceId(suggestion.place_id);
            
            // Create PlaceResult for backward compatibility
            const placeResult: PlaceResult = {
              place_id: savedEstablishment.place_id,
              name: savedEstablishment.name,
              address: savedEstablishment.formatted_address || '',
              location: {
                lat: savedEstablishment.lat || 0,
                lng: savedEstablishment.lng || 0
              },
              website: savedEstablishment.website,
              phone: savedEstablishment.phone,
              rating: savedEstablishment.rating,
              user_ratings_total: savedEstablishment.user_ratings_total,
              source: 'google-places'
            };

            onSelect(placeResult);
            onEstablishmentSaved?.(savedEstablishment);
            setShowSuggestions(false);
            setSuggestions([]);
            
            // Create a new session token for next search
            createNewSessionToken().then(setSessionToken);
            
          } catch (error) {
            console.error('Error saving establishment:', error);
            toast({
              title: "Erreur",
              description: "Impossible d'enregistrer l'établissement",
              variant: "destructive",
              duration: 3000
            });
          } finally {
            setIsSaving(false);
          }
        } else {
          console.error('Erreur PlacesService:', status);
          toast({
            title: "Erreur",
            description: "Impossible de récupérer les détails de l'établissement",
            variant: "destructive",
            duration: 3000
          });
          setIsSaving(false);
        }
      });
      
    } catch (error) {
      console.error('Error saving establishment:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'établissement",
        variant: "destructive",
        duration: 3000
      });
      setIsSaving(false);
    }
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

  // Gérer les clics en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (apiError) {
    return (
      <div className="relative">
        <div className="w-full p-4 border rounded-md bg-destructive/10 border-destructive/50">
          <p className="text-sm text-destructive font-medium">{apiError}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Contactez l'administrateur pour configurer la clé API Google Maps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn("w-full", className)}
          disabled={apiError !== null || isSaving}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading || isSaving ? (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 shadow-lg border bg-background z-[1000] max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id}
                className={`flex items-center p-3 cursor-pointer border-b last:border-b-0 hover:bg-accent/50 transition-colors ${
                  index === selectedIndex ? 'bg-accent' : ''
                }`}
                onClick={() => selectSuggestion(suggestion)}
              >
                <MapPin className="h-4 w-4 text-muted-foreground mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  {suggestion.structured_formatting?.secondary_text && (
                    <div className="text-xs text-muted-foreground truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}