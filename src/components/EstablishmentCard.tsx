import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, MapPin, Phone, Globe, Star, Users, ExternalLink } from "lucide-react";
import { EstablishmentData } from "@/services/establishments";
import { useEffect, useState } from "react";
import { getPlaceDetails, normalizePhoneNumber, PlaceDetailsResponse } from "@/services/placeDetails";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EstablishmentCardProps {
  establishment: EstablishmentData | null;
  isLoading?: boolean;
}

export default function EstablishmentCard({ establishment, isLoading }: EstablishmentCardProps) {
  const [placeDetails, setPlaceDetails] = useState<PlaceDetailsResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch place details when establishment changes
  useEffect(() => {
    if (establishment?.place_id && !placeDetails) {
      setLoadingDetails(true);
      getPlaceDetails(establishment.place_id)
        .then(setPlaceDetails)
        .catch(console.error)
        .finally(() => setLoadingDetails(false));
    }
  }, [establishment?.place_id, placeDetails]);
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!establishment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-muted-foreground" />
            Mon Établissement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aucun établissement sélectionné. Utilisez l'autocomplétion ci-dessus pour en choisir un.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatTypes = (types: any) => {
    if (!types || !Array.isArray(types) || types.length === 0) return null;
    
    const typeTranslations: Record<string, string> = {
      'restaurant': 'Restaurant',
      'food': 'Restaurant',
      'establishment': 'Établissement',
      'point_of_interest': 'Point d\'intérêt',
      'store': 'Magasin',
      'cafe': 'Café',
      'bar': 'Bar',
      'lodging': 'Hébergement',
      'tourist_attraction': 'Attraction touristique'
    };

    const primaryType = types[0];
    return typeTranslations[primaryType] || primaryType;
  };

  const displayPhone = placeDetails?.phone || establishment.phone;
  const displayMapsUrl = placeDetails?.mapsUrl;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Mon Établissement
            </div>
            <div className="flex items-center gap-2">
              {displayPhone && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-xl"
                      onClick={() => window.location.href = `tel:${normalizePhoneNumber(displayPhone)}`}
                      aria-label="Appeler"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Appeler</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {displayMapsUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-xl"
                      onClick={() => window.open(displayMapsUrl, '_blank', 'noopener,noreferrer')}
                      aria-label="Ouvrir dans Google Maps"
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ouvrir dans Google Maps</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{establishment.name}</h3>
            {formatTypes(establishment.types) && (
              <p className="text-sm text-muted-foreground">{formatTypes(establishment.types)}</p>
            )}
          </div>

          {establishment.formatted_address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-sm">{establishment.formatted_address}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Téléphone :</span>
            <span className="text-sm">
              {displayPhone ? (
                <a 
                  href={`tel:${normalizePhoneNumber(displayPhone)}`}
                  className="text-primary hover:underline"
                >
                  {displayPhone}
                </a>
              ) : (loadingDetails ? "Chargement..." : "—")}
            </span>
          </div>

          {establishment.website && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Site web :</span>
              <a 
                href={establishment.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Ouvrir <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Google Maps :</span>
            <span className="text-sm">
              {displayMapsUrl ? (
                <a 
                  href={displayMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Ouvrir <ExternalLink className="w-3 h-3" />
                </a>
              ) : (loadingDetails ? "Chargement..." : "—")}
            </span>
          </div>

          {establishment.rating && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">{establishment.rating.toFixed(1)}</span>
              </div>
              {establishment.user_ratings_total && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {establishment.user_ratings_total} avis
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Place ID: {establishment.place_id}
            </p>
            <p className="text-xs text-muted-foreground">
              Source: {establishment.source || 'Google'} • 
              Ajouté le {establishment.created_at ? new Date(establishment.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
            </p>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}