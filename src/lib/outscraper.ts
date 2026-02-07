/**
 * Client Outscraper pour récupérer les avis Google Maps.
 * À utiliser côté serveur (Node) uniquement : la clé API ne doit pas être exposée au navigateur.
 * Dans l'app Vite, l'import des avis passe par l'Edge Function Supabase (import-google-reviews)
 * qui appelle l'API Outscraper et enregistre en base.
 */

// @ts-expect-error outscraper peut ne pas avoir de types
import Outscraper from "outscraper";

export interface OutscraperReview {
  author: string;
  rating: number;
  text: string;
  date: string;
  timestamp: number | null;
}

const apiKey =
  typeof process !== "undefined" && process.env?.OUTSCRAPER_API_KEY
    ? process.env.OUTSCRAPER_API_KEY
    : "";

/**
 * Récupère les avis Google via le SDK Outscraper.
 * Tri : newest, langue : fr.
 * @param placeId - Google Place ID (utilisé si queryTexte non fourni)
 * @param limit - Nombre max d'avis (défaut 100)
 * @param options - Optionnel : { name, address } pour envoyer "nom, adresse" à Outscraper (souvent plus fiable qu'un place_id seul)
 * @returns Avis formatés (auteur, note, texte, date, timestamp)
 */
export async function fetchGoogleReviews(
  placeId: string,
  limit: number = 100,
  options?: { name?: string; address?: string }
): Promise<OutscraperReview[]> {
  if (!apiKey) {
    throw new Error("OUTSCRAPER_API_KEY is not set");
  }
  const nom = options?.name?.trim() ?? "";
  const adresse = options?.address?.trim() ?? "";
  const queryTexte = [nom, adresse].filter(Boolean).join(", ");
  const query = queryTexte || placeId;

  console.log("[outscraper] Envoi Outscraper:", {
    placeId,
    source: queryTexte ? "nom+adresse" : "place_id",
    query,
  });

  const client = new Outscraper(apiKey);
  const response = await client.googleMapsReviews([query], {
    reviewsLimit: limit,
    sort: "newest",
    language: "fr",
  });

  console.log("[outscraper] Réponse brute Outscraper (avant traitement):", response);

  if (!response || !Array.isArray(response)) {
    return [];
  }
  const rows = Array.isArray(response[0]) ? response[0] : response;
  const reviews = (rows as any[]).map((r: any) => ({
    author: r.author_title ?? r.author_name ?? r.name ?? "",
    rating: typeof r.rating === "number" ? r.rating : parseInt(String(r.rating || 0), 10) || 0,
    text: r.review_text ?? r.review ?? r.text ?? "",
    date: r.review_datetime_utc ?? r.date ?? r.published_at ?? "",
    timestamp: r.review_timestamp ?? (r.review_datetime_utc ? new Date(r.review_datetime_utc).getTime() : null),
  }));
  return reviews;
}
