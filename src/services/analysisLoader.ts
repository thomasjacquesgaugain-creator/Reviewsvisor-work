import { supabase } from "@/integrations/supabase/client";
import { getCurrentEstablishment } from "@/services/establishments";
import i18n from "@/i18n/config";

export interface AnalysisData {
  total_count: number | null;
  avg_rating: number | null;
  top_issues: any[] | null;
  top_praises: any[] | null;
  positive_ratio: number | null;
  last_analyzed_at: string | null;
  summary: any | null;
  themes: any[] | null;
  business_type: any[] | null;
  business_type_confidence: number | null;
  business_type_candidates: any[] | null;
  themes_universal: any[] | null;
  themes_industry: any[] | null;
  pain_points_prioritized: any[] | null;
  recommendations_quick_wins: any[] | null;
  recommendations_projects:any[] | null;
  summary_one_liner: any[] | null;
  summary_what_customers_love:any[] | null;
  summary_what_customers_hate:any[] | null;
  analysis_version: string | null;
}

export interface LoadAnalysisResult {
  success: boolean;
  data: AnalysisData | null;
  error?: string;
  hasAnalysis: boolean;
}

// Colonnes garanties présentes dans review_insights (schéma de base).
// Les colonnes business_type, themes_universal, etc. sont optionnelles (migration 20260128).
const REVIEW_INSIGHTS_BASE_COLUMNS =
  'total_count, avg_rating, top_issues, top_praises, positive_ratio, last_analyzed_at, summary, themes,themes_universal,themes_industry,pain_points_prioritized , recommendations_quick_wins , recommendations_projects,summary_one_liner ,summary_what_customers_love ,summary_what_customers_hate,analysis_version ,business_type,business_type_confidence,business_type_candidates'

/**
 * Charge la dernière analyse pour un établissement donné.
 * Ne retourne jamais de valeurs numériques par défaut (0) : data = null si pas de ligne.
 * @param placeId - L'ID de l'établissement (place_id)
 * @param userId - L'ID de l'utilisateur
 * @returns Le résultat du chargement avec les données d'analyse ou null si aucune analyse
 */
function localizeAnalysisData(data: any) {
  const lang = i18n.language.startsWith("fr")
    ? "fr"
    : "en";

  return {
    ...data,
    top_issues_original:
      data?.top_issues || {},
    top_issues:
      data?.top_issues?.[lang] || [],

    top_praises:
      data?.top_praises?.[lang] || [],

    themes_universal:
      data?.themes_universal?.[lang] || [],

    themes_industry:
      data?.themes_industry?.[lang] || [],

    pain_points_prioritized:
      data?.pain_points_prioritized?.[lang] || [],

    recommendations_quick_wins:
      data?.recommendations_quick_wins?.[lang] || [],

    recommendations_projects:
      data?.recommendations_projects?.[lang] || [],

    summary_one_liner:
      data?.summary_one_liner?.[lang] || "",

    summary_what_customers_love:
      data?.summary_what_customers_love?.[lang] || [],

    summary_what_customers_hate:
      data?.summary_what_customers_hate?.[lang] || [],

    summary: data?.summary?.[lang]||[]  
  };
}
export async function loadLatestAnalysis(
  placeId: string,
  userId: string
): Promise<LoadAnalysisResult> {
  try {
    const { data, error } = await supabase
      .from('review_insights')
      .select(REVIEW_INSIGHTS_BASE_COLUMNS)
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .order('last_analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[loadLatestAnalysis] Error loading analysis:', error);
      return {
        success: false,
        data: null,
        error: error.message,
        hasAnalysis: false,
      };
    }

    if (!data) {
      return {
        success: true,
        data: null,
        hasAnalysis: false,
      };
    }

    // Vérifier si l'analyse est valide (a au moins une date d'analyse)
    const hasAnalysis = !!data.last_analyzed_at;
    return {
      success: true,
      data: localizeAnalysisData(data) as AnalysisData,
      hasAnalysis,
    };
  } catch (error) {
    console.error('[loadLatestAnalysis] Unexpected error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasAnalysis: false,
    };
  }
}

/**
 * Charge la dernière analyse pour l'établissement actif de l'utilisateur
 * @param userId - L'ID de l'utilisateur
 * @returns Le résultat du chargement avec les données d'analyse ou null si aucune analyse
 */
export async function loadLatestAnalysisForActiveEstablishment(
  userId: string
): Promise<LoadAnalysisResult & { placeId?: string }> {
  try {
    // Récupérer l'établissement actif
    // const { data: activeEstablishment, error: estabError } = await supabase
    //   .from('établissements')
    //   .select('place_id, nom')
    //   .eq('user_id', userId)
    //   .eq('is_active', true)
    //   .maybeSingle();


    const activeEstablishment = await getCurrentEstablishment();




    // if (estabError) {
    //   console.error('[loadLatestAnalysisForActiveEstablishment] Error loading active establishment:', estabError);
    //   return {
    //     success: false,
    //     data: null,
    //     error: estabError.message,
    //     hasAnalysis: false,
    //   };
    // }

    if (!activeEstablishment?.place_id) {
      return {
        success: true,
        data: null,
        hasAnalysis: false,
      };
    }

    // Charger l'analyse pour cet établissement
    const result = await loadLatestAnalysis(activeEstablishment.place_id, userId);
    return {
      ...result,
      placeId: activeEstablishment.place_id,
    };
  } catch (error) {
    console.error('[loadLatestAnalysisForActiveEstablishment] Unexpected error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasAnalysis: false,
    };
  }
}
