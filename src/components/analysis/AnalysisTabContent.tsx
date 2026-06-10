import { AnalysisPage } from "./AnalysisPage";
import { transformAnalysisData } from "@/utils/transformAnalysisData";
import { CompleteAnalysisData, Review } from "@/types/analysis";
import { AlertTriangle, Loader2 } from "lucide-react";
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
    return analysisDataComputed.themes.map((theme: any) => ({
      theme: theme?.theme ?? theme?.name ?? theme,
      count: theme?.count ?? 0,
      importance: theme?.importance ?? theme?.score ?? 0
    }));
  }, [analyse]);

  const themeDefinitions = useMemo(() => {
    const lang = i18n?.language?.startsWith("fr") ? "fr" : "en";
    const source: any = analyse ?? {};

    const extractLocalizedThemes = (value: any) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (Array.isArray(value?.[lang])) return value[lang];
      return [];
    };

    const universal = extractLocalizedThemes(source?.themes_universal);
    const industry = extractLocalizedThemes(source?.themes_industry);

    return [...universal, ...industry]
      .map((theme: any) => ({
        key: String(theme?.key ?? "").trim(),
        theme: String(theme?.theme ?? "").trim(),
      }))
      .filter((theme: { key: string; theme: string }) => theme.key && theme.theme);
  }, [analyse, i18n?.language]);

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
          <p className="text-xs text-white text-muted-foreground mb-1">
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
          themeDefinitions={themeDefinitions}
          insight={analyse}
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
    <div className="flex items-center justify-center py-0">
      <div className="w-full max-w-full rounded-xl bg-white p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t(
                "dashboard.noAnalysisAvailable",
                'No analysis available for this establishment. Click "Analyze" in the location map to get started.',
              )}
            </p>

            <p className="text-xs text-muted-foreground">
              {t(
                "dashboard.importAndAnalyzeToSeeResults",
                "Report reviews and run an analysis to see the results",
              )}
            </p>
          </div>
        </div>
      </div>
  </div>
  );
}
