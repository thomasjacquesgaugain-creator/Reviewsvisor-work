import { supabase } from "@/integrations/supabase/client";

export interface PlaceDetailsResponse {
  phone: string | null;
  phoneIntl: string | null;
  mapsUrl: string | null;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('get-place-details', {
      body: { placeId }
    });

    if (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }

    const result = data?.result;
    if (!result) {
      return {
        phone: null,
        phoneIntl: null,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`
      };
    }

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
  return phone.replace(/[\s.-]/g, '');
}