import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, MapPin, Phone, Globe, Star, Users } from "lucide-react";
import { EstablishmentData } from "@/services/establishments";

interface EstablishmentCardProps {
  establishment: EstablishmentData | null;
  isLoading?: boolean;
}

export default function EstablishmentCard({ establishment, isLoading }: EstablishmentCardProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5 text-primary" />
          Mon Établissement
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

        {establishment.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <a 
              href={`tel:${establishment.phone}`}
              className="text-sm text-primary hover:underline"
            >
              {establishment.phone}
            </a>
          </div>
        )}

        {establishment.website && (
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <a 
              href={establishment.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Site web
            </a>
          </div>
        )}

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
            Source: {establishment.source || 'Google'} • 
            Ajouté le {establishment.created_at ? new Date(establishment.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}