import { supabase } from "@/integrations/supabase/client";

export interface ImportGoogleReviewsResult {
  success: boolean;
  total: number;
  inserted: number;
  skipped: number;
  message?: string;
  error?: string;
}

/**
 * Appelle la route API locale /api/reviews/import (pas de CORS) ou, en secours,
 * l'Edge Function import-google-reviews. Les doublons (même auteur + même date) sont ignorés.
 * Envoie nom + adresse pour que l'API construise la query Outscraper "[nom], [adresse], France".
 */
export async function importGoogleReviews(
  placeId: string,
  limit: number = 2000,
  options?: { name?: string; address?: string }
): Promise<ImportGoogleReviewsResult> {
  console.log("[importGoogleReviews] place_id:", placeId, "limit:", limit, "name:", options?.name, "address:", options?.address);

  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.access_token) {
    throw new Error("Utilisateur non connecté");
  }

  const token = session.session.access_token;
  const payload = { placeId, limit, name: options?.name ?? undefined, address: options?.address ?? undefined };

  // 1) Essayer la route API locale (même origin = pas de CORS)
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(`${base}/api/reviews/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as ImportGoogleReviewsResult & { error?: string };
    console.log("[importGoogleReviews] Réponse complète api/reviews/import (avant traitement):", {
      ok: res.ok,
      status: res.status,
      data,
    });
    if (res.ok) {
      return {
        success: true,
        total: data.total ?? 0,
        inserted: data.inserted ?? 0,
        skipped: data.skipped ?? 0,
        message: data.message,
      };
    }
    return {
      success: false,
      total: 0,
      inserted: 0,
      skipped: 0,
      error: data.error || `HTTP ${res.status}`,
    };
  } catch (localErr) {
    // 2) Fallback : Edge Function (peut échouer à cause de CORS si non déployée correctement)
    console.warn("[importGoogleReviews] Local API failed, trying Edge Function:", localErr);
  }

  const { data, error } = await supabase.functions.invoke("import-google-reviews", {
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("[importGoogleReviews] Réponse complète Edge Function (avant traitement):", { data, error });

  if (error) {
    console.error("[importGoogleReviews] Edge function error:", error);
    return {
      success: false,
      total: 0,
      inserted: 0,
      skipped: 0,
      error: error.message || "Erreur lors de l'import",
    };
  }

  const body = data as ImportGoogleReviewsResult | null;
  if (!body) {
    return {
      success: false,
      total: 0,
      inserted: 0,
      skipped: 0,
      error: "Réponse invalide",
    };
  }

  if (body.error) {
    return {
      ...body,
      success: false,
      error: body.error,
    };
  }

  return {
    success: true,
    total: body.total ?? 0,
    inserted: body.inserted ?? 0,
    skipped: body.skipped ?? 0,
    message: body.message,
  };
}
