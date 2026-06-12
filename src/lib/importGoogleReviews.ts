import { supabase } from "@/integrations/supabase/client";

export interface ImportGoogleReviewsResult {
  success: boolean;
  jobId?: string; 
  total: number;
  inserted: number;
  skipped: number;
  updated:number;
  message?: string;
  error?: string;
}

export type ImportReviewSource = "google" | "tripadvisor" | "trustpilot";

/**
 * Appelle la route API locale /api/reviews/import (pas de CORS) ou, en secours,
 * l'Edge Function import-google-reviews. Les doublons (même auteur + même date + même source) sont ignorés.
 * Envoie nom + adresse pour que l'API construise la query Outscraper "[nom], [adresse], France".
 */
export async function importGoogleReviews(
  placeId: string,
  limit: number = 2000,
  options?: { name?: string; address?: string; source?: ImportReviewSource; forceFullImport?: boolean }
): Promise<ImportGoogleReviewsResult> {
  const source = options?.source ?? "google";
  console.log("[importGoogleReviews] place_id:", placeId, "limit:", limit, "source:", source, "name:", options?.name, "address:", options?.address);

  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.access_token) {
    throw new Error("Utilisateur non connecté");
  }

  const token = session.session.access_token;
  const payload = {
    placeId,
    limit,
    name: options?.name ?? undefined,
    address: options?.address ?? undefined,
    source,
    forceFullImport: options?.forceFullImport ?? false,
  };

  // deprecated import reviews code
  // 1) Essayer la route API locale (même origin = pas de CORS)
  // try {
  //   const base = typeof window !== "undefined" ? window.location.origin : "";
  //   const res = await fetch(`${base}/api/reviews/import`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${token}`,
  //     },
  //     body: JSON.stringify(payload),
  //   });
  //   const data = (await res.json()) as ImportGoogleReviewsResult & { error?: string };
  //   console.log("[importGoogleReviews] Réponse complète api/reviews/import (avant traitement):", {
  //     ok: res.ok,
  //     status: res.status,
  //     data,
  //   });
  //   if (res.ok) {
  //     return {
  //       success: true,
  //       total: data.total ?? 0,
  //       inserted: data.inserted ?? 0,
  //       skipped: data.skipped ?? 0,
  //       updated:data.updated??0,
  //       message: data.message,
  //     };
  //   }
  //   return {
  //     success: false,
  //     total: 0,
  //     inserted: 0,
  //     skipped: 0,
  //     updated:0,
  //     error: data.error || `HTTP ${res.status}`,
  //   };
  // } catch (localErr) {
  //   // 2) Fallback : Edge Function (peut échouer à cause de CORS si non déployée correctement)
  //   console.warn("[importGoogleReviews] Local API failed, trying Edge Function:", localErr);
  // }

  const { data, error } = await supabase.functions.invoke("outscraper-google-reviews", {
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
      updated:0,
      error: error.message || "Erreur lors de l'import",
    };
  }



  let body: ImportGoogleReviewsResult | null = null;

if (typeof data === "string") {
  try {
    const fixed = data.replace(/(\w+):/g, '"$1":');
    body = JSON.parse(fixed);
  } catch (e) {
    console.error("Parsing failed:", e);
    body = null;
  }
} else {
  body = data;
}


  if (!body) {
    return {
      success: false,
      total: 0,
      inserted: 0,
      skipped: 0,
      updated:0,
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
    jobId: body.jobId,
    total: body.total ?? 0,
    inserted: body.inserted ?? 0,
    skipped: body.skipped ?? 0,
    updated:body.updated??0,
    message: body.message,
  };
}
