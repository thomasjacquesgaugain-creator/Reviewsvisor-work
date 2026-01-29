import { AnalysisPage } from "./AnalysisPage";
import { transformAnalysisData } from "@/utils/transformAnalysisData";
import { CompleteAnalysisData, Review } from "@/types/analysis";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export interface AnalysisTabContentProps {
  /** Données d'analyse pré-calculées (source de vérité unique, prioritaire) */
  analysisData?: CompleteAnalysisData | null;
  /** Insight brut (fallback si analysisData non fourni) */
  analyse?: any;
  reviews: Review[];
  establishmentName?: string;
  isLoading?: boolean;
  /** True si les données viennent du fallback (avis seuls, pas d'insight) */
  isFallbackAnalysis?: boolean;
  /** Date de la dernière analyse (insight) si disponible */
  lastAnalyzedAt?: string | null;
}

export function AnalysisTabContent({
  analysisData: analysisDataProp,
  analyse,
  reviews,
  establishmentName,
  isLoading = false,
  isFallbackAnalysis = false,
  lastAnalyzedAt: lastAnalyzedAtProp
}: AnalysisTabContentProps) {
  const { t, i18n } = useTranslation();

  // Fallback : calculer à partir de insight + reviews si analysisData non fourni
  const analysisDataComputed = useMemo(() => {
    if (!analyse) return null;
    try {
      return transformAnalysisData(analyse, reviews ?? []);
    } catch (error) {
      console.error('[AnalysisTabContent] Error transforming data:', error);
      return null;
    }
  }, [analyse, reviews]);

  const analysisData = analysisDataProp ?? analysisDataComputed;

  // Source de vérité unique pour la date de dernière analyse (prop > analysisData > null)
  const lastAnalyzedAt =
    lastAnalyzedAtProp ??
    (analysisData as { last_analyzed_at?: string; lastAnalyzedAt?: string } | null)?.last_analyzed_at ??
    (analysisData as { last_analyzed_at?: string; lastAnalyzedAt?: string } | null)?.lastAnalyzedAt ??
    null;

  const dynamicThemes = useMemo(() => {
    if (!analyse?.themes || !Array.isArray(analyse.themes)) {
      return [];
    }
    return analyse.themes.map((theme: any) => ({
      theme: theme?.theme ?? theme?.name ?? theme,
      count: theme?.count ?? 0,
      importance: theme?.importance ?? theme?.score ?? 0
    }));
  }, [analyse]);

  // Règle unique : afficher les graphes dès que analysisData est présent (pas de flag hasRunAnalysis / isAnalyzed)
  if (analysisData) {
    const locale = i18n?.language === "fr" ? fr : undefined;
    const formattedLastAnalysis =
      lastAnalyzedAt &&
      (() => {
        try {
          const d = parseISO(lastAnalyzedAt);
          return isNaN(d.getTime()) ? null : format(d, "dd/MM/yyyy", { locale });
        } catch {
          return null;
        }
      })();

    return (
      <div className="space-y-1">
        {(isFallbackAnalysis || formattedLastAnalysis) && (
          <p className="text-xs text-muted-foreground mb-1">
            {isFallbackAnalysis && t("dashboard.analysisBasedOnImportedReviews", "Analyse basée sur les avis importés")}
            {isFallbackAnalysis && formattedLastAnalysis && " · "}
            {formattedLastAnalysis &&
              t("dashboard.lastAnalysis", "Dernière analyse : {{date}}", { date: formattedLastAnalysis })}
          </p>
        )}
        <AnalysisPage
          data={analysisData}
          establishmentName={establishmentName}
          reviews={reviews}
          dynamicThemes={dynamicThemes}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("common.loading", "Chargement...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-sm">{t("dashboard.noAnalysisAvailable", "Aucune analyse disponible pour cet établissement.")}</p>
      <p className="text-xs mt-2">{t("dashboard.importAndAnalyzeToSeeResults", "Importez des avis et lancez une analyse pour voir les résultats.")}</p>
    </div>
  );
}
