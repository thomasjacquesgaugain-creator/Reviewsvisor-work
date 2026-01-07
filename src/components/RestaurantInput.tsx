import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface Establishment {
  place_id: string;
  name: string;
  address: string;
  rating?: number;
  user_ratings_total?: number;
  location: {
    lat: number;
    lng: number;
  };
  google_url: string;
}

interface RestaurantInputProps {
  onAnalyze: (restaurantData: { name: string; url: string }) => void;
}

export const RestaurantInput = ({ onAnalyze }: RestaurantInputProps) => {
  const { t } = useTranslation();
  const [restaurantName, setRestaurantName] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Establishment[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const { toast } = useToast();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Search for establishments with debounce
  const searchEstablishments = async (query: string) => {
    console.log('searchEstablishments called with query:', query);
    
    if (query.trim().length < 2) {
      console.log('Query too short, clearing suggestions');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    console.log('Starting search for:', query);
    
    try {
      console.log('Calling supabase function search-establishments');
      const { data, error } = await supabase.functions.invoke('search-establishments', {
        body: { query: query.trim() }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Error searching establishments:', error);
        toast({
          title: t("errors.searchError"),
          description: t("errors.cannotSearchEstablishments"),
          variant: "destructive",
        });
        return;
      }

      console.log('Establishments found:', data?.establishments?.length || 0);
      setSuggestions(data.establishments || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error in searchEstablishments:', error);
      toast({
        title: t("common.error"),
        description: t("errors.searchErrorOccurred"),
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (value: string) => {
    console.log('Input changed to:', value);
    setRestaurantName(value);
    setSelectedEstablishment(null);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      console.log('Debounce timeout fired, searching for:', value);
      searchEstablishments(value);
    }, 300);
  };

  // Handle establishment selection
  const handleEstablishmentSelect = (establishment: Establishment) => {
    setRestaurantName(establishment.name);
    setGoogleUrl(establishment.google_url);
    setSelectedEstablishment(establishment);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim()) return;

    setIsLoading(true);
    
    // Use selected establishment URL or generate one
    const finalUrl = selectedEstablishment 
      ? selectedEstablishment.google_url 
      : googleUrl || `https://maps.google.com/search/${encodeURIComponent(restaurantName)}`;
    
    // Simulation d'un délai d'analyse
    setTimeout(() => {
      onAnalyze({
        name: restaurantName,
        url: finalUrl
      });
      setIsLoading(false);
    }, 2000);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            {t("restaurant.analyzeYourRestaurant")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("restaurant.enterNameOrUrl")}
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {t("restaurant.restaurantInformation")}
            </CardTitle>
            <CardDescription>
              {t("restaurant.weWillAnalyzeAllComments")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 relative" ref={suggestionRef}>
                <label htmlFor="restaurant-name" className="text-sm font-medium">
                  {t("restaurant.restaurantName")} *
                </label>
                <div className="relative">
                  <Input
                    id="restaurant-name"
                    type="text"
                    placeholder={t("restaurant.restaurantNamePlaceholder")}
                    value={restaurantName}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    required
                    className="pr-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1">
                    <Card className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                      <CardContent className="p-0">
                        {suggestions.map((establishment) => (
                          <div
                            key={establishment.place_id}
                            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
                            onClick={() => handleEstablishmentSelect(establishment)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">{establishment.name}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                  {establishment.address}
                                </p>
                                {establishment.rating && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {establishment.rating.toFixed(1)}
                                      {establishment.user_ratings_total && 
                                        ` (${t("restaurant.reviewsCount", { count: establishment.user_ratings_total })})`
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                              <MapPin className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="google-url" className="text-sm font-medium">
                  {t("restaurant.googleMapsUrlOptional")}
                </label>
                <Input
                  id="google-url"
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                disabled={isLoading || !restaurantName.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    {t("restaurant.analysisInProgress")}
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    {t("restaurant.analyzeComments")}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};