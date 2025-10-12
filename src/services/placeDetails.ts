import { loadGooglePlaces } from "@/lib/loadGooglePlaces";

export interface PlaceDetailsResponse {
  phone: string | null;
  phoneIntl: string | null;
  mapsUrl: string | null;
}

function mapPlacesStatus(status: string, errorMessage?: string): string | null {
  const g = (window as any).google;
  if (!g?.maps?.places) return 'Google Places non chargé';
  
  switch (status) {
    case g.maps.places.PlacesServiceStatus.OK:
    case g.maps.places.PlacesServiceStatus.ZERO_RESULTS:
      return null;
    case g.maps.places.PlacesServiceStatus.REQUEST_DENIED:
      return 'Clé Google invalide ou non autorisée (référents/API).';
    case g.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
      return 'Quota dépassé. Réessayez plus tard.';
    case g.maps.places.PlacesServiceStatus.INVALID_REQUEST:
      return 'Requête invalide (paramètre manquant).';
    default:
      return errorMessage || status || 'Erreur inconnue Google Places';
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse> {
  try {
    await loadGooglePlaces();
    const g = (window as any).google;
    const svc = new g.maps.places.PlacesService(document.createElement('div'));

    const result: any = await new Promise((resolve, reject) => {
      svc.getDetails(
        {
          placeId,
          fields: [
            'place_id',
            'url',
            'formatted_phone_number',
            'international_phone_number'
          ]
        },
        (res: any, status: string) => {
          const err = mapPlacesStatus(status);
          if (err) {
            reject(new Error(err));
          } else if (res) {
            resolve(res);
          } else {
            reject(new Error('Aucun résultat'));
          }
        }
      );
    });

    return {
      phone: result.formatted_phone_number || null,
      phoneIntl: result.international_phone_number || null,
      mapsUrl: result.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`
    };
  } catch (error) {
    console.error('Failed to get place details:', error);
    return {
      phone: null,
      phoneIntl: null,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`
    };
  }
}

export function normalizePhoneNumber(phone: string): string {
  // Remove spaces, dots, and dashes for tel: link
  return phone.replace(/\s|\.|-/g, '');
}
