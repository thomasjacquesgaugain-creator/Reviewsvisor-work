import { loadGooglePlaces } from "@/lib/loadGooglePlaces";

export interface PlaceDetailsResponse {
  phone: string | null;
  phoneIntl: string | null;
  mapsUrl: string | null;
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
          if (status === g.maps.places.PlacesServiceStatus.OK && res) resolve(res);
          else if (status === g.maps.places.PlacesServiceStatus.REQUEST_DENIED) reject(new Error('Clé Google invalide ou non autorisée. Vérifiez VITE_GOOGLE_MAPS_BROWSER_KEY et ses restrictions.'));
          else reject(new Error(status));
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
