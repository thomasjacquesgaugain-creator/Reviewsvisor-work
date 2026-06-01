import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { DiagnosticSummary, OverviewMetrics, ParetoItem } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { CheckCircle, AlertTriangle, Lightbulb, Star, TrendingUp, Target } from "lucide-react";
import { useState, useMemo } from "react";
import { normalizeSummary } from "@/utils/normalizeSummary";

interface DiagnosticSectionProps {
  data: DiagnosticSummary;
  overview?: OverviewMetrics;
  paretoIssues?: ParetoItem[];
  totalReviews?: number;
  onThemeSelect?: (theme: string) => void;
}

export function DiagnosticSection({ 
  data, 
  overview, 
  paretoIssues,
  totalReviews = 0,
  onThemeSelect 
}: DiagnosticSectionProps) {
  const { t } = useTranslation();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("analysis.diagnostic.title", "Synthèse & diagnostic")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <p>{t("analysis.diagnostic.noData", "Aucune donnée disponible")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topStrengths = data.topStrengths || [];
  const topWeaknesses = data.topWeaknesses || [];
  const normalizedSummary = useMemo(() => normalizeSummary(data.summary), [data.summary]);
  const summaryText =
    normalizedSummary?.text ||
    data.summary ||
    t("analysis.diagnostic.noSummary", "Aucun résumé disponible");
  const recommendations =
    (data as any).recommendations?.length > 0
      ? (data as any).recommendations
      : normalizedSummary?.recommendations || [];

  const getConfidenceLevel = (total: number) => {
  if (total < 30) {
    return {
      label: t("analysis.syntheseAndDiagnostic.confidence.lowLabel"),
      color: "bg-amber-100 text-amber-700 border-amber-300",
      tooltipTitle: t("analysis.syntheseAndDiagnostic.confidence.lowTooltipTitle"),
      tooltipText: t("analysis.syntheseAndDiagnostic.confidence.lowTooltipText"),
      tooltipSecondary: t("analysis.syntheseAndDiagnostic.confidence.tooltipSecondary")
    };
  }
  if (total < 100) {
    return {
      label: t("analysis.syntheseAndDiagnostic.confidence.mediumLabel"),
      color: "bg-blue-100 text-blue-700 border-blue-300",
      tooltipTitle: t("analysis.syntheseAndDiagnostic.confidence.mediumTooltipTitle"),
      tooltipText: t("analysis.syntheseAndDiagnostic.confidence.mediumTooltipText"),
      tooltipSecondary: t("analysis.syntheseAndDiagnostic.confidence.tooltipSecondary")
    };
  }
  return {
    label: t("analysis.syntheseAndDiagnostic.confidence.highLabel"),
    color: "bg-green-100 text-green-700 border-green-300",
    tooltipTitle: t("analysis.syntheseAndDiagnostic.confidence.highTooltipTitle"),
    tooltipText: t("analysis.syntheseAndDiagnostic.confidence.highTooltipText"),
    tooltipSecondary: null
  };
};

  const confidence = getConfidenceLevel(totalReviews);

  // Irritant #1
  const topIssue = paretoIssues && paretoIssues.length > 0 ? paretoIssues[0] : null;

  // Phrase de décision automatique
  const decisionPhrase = useMemo(() => {
    const mainProblem = topWeaknesses.length > 0 ? topWeaknesses[0] : null;
    const mainStrengths = topStrengths.slice(0, 2);
    
    if (!mainProblem) return null;
    
    const problemName = mainProblem.theme;
    const strengthsList = mainStrengths.map(s => s.theme).join(t("analysis.syntheseAndDiagnostic.decisionAnd")); 

   if (mainStrengths.length === 0) {
    return t("analysis.syntheseAndDiagnostic.decisionPhraseOnly", { problem: problemName });
  }
  return t("analysis.syntheseAndDiagnostic.decisionPhraseWithStrengths", {
    problem: problemName,
    strengths: strengthsList
  });
  }, [topWeaknesses, topStrengths]);

  // Handler pour clic sur un thème
  const handleThemeClick = (theme: string) => {
    setSelectedTheme(theme === selectedTheme ? null : theme);
    if (onThemeSelect) {
      onThemeSelect(theme);
    }
  };

  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("analysis.syntheseAndDiagnostic.title")}</CardTitle>
          {totalReviews > 0 && (
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={confidence.color}>
                {confidence.label}
              </Badge>
              <InfoTooltip
                content={t("analysis.syntheseAndDiagnostic.confidence.tooltipFull", {
                  title: confidence.tooltipTitle,
                  text: confidence.tooltipText,
                  secondary: confidence.tooltipSecondary ?? ""
                })}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Mini-KPIs (3 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Note moyenne */}
            {overview && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800/40 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("analysis.syntheseAndDiagnostic.averageRating")}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {overview.averageRating.toFixed(1)}/5
                </p>
              </div>
            )}

            {/* % d'avis positifs */}
            {overview && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800/40 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("analysis.syntheseAndDiagnostic.positiveReviews")}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {overview.positivePercentage.toFixed(0)}%
                </p>
              </div>
            )}

            {/* Irritant #1 */}
            {topIssue && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800/40 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("analysis.syntheseAndDiagnostic.topIrritant")}</span>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate" title={topIssue.name}>
                  {topIssue.name}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {topIssue.percentage.toFixed(0)}% • {t("analysis.syntheseAndDiagnostic.mentions", { count: topIssue.count })}
                </p>
              </div>
            )}
          </div>

          {/* Résumé */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              {t("analysis.syntheseAndDiagnostic.overview")}
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{summaryText}</p>

            <div className="mt-4">
              {recommendations.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {recommendations.slice(0, 8).map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("analysis.syntheseAndDiagnostic.noRecommendations")}
                </p>
              )}
            </div>
          </div>

          {/* Phrase de décision automatique */}
          {decisionPhrase && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-900/50">
              <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                {decisionPhrase}
              </p>
            </div>
          )}

          {/* Layout 2 colonnes : Problèmes (gauche) et Points forts (droite) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 3 Problèmes prioritaires - GAUCHE */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                {t("analysis.syntheseAndDiagnostic.top3PrioritizedIssues")}
              </h3>
              {topWeaknesses.length > 0 ? (
                <div className="space-y-2">
                  {topWeaknesses.slice(0, 3).map((weakness, index) => (
                    <div
                      key={index}
                      onClick={() => handleThemeClick(weakness.theme)}
                      className={`flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedTheme === weakness.theme 
                          ? 'border-red-400 shadow-md' 
                          : 'border-transparent hover:border-red-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{weakness.theme}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <Badge variant="destructive" className="text-xs">
                          {weakness.count}
                        </Badge>
                        <span 
                          className="text-xs text-slate-600 dark:text-slate-300"
                          title= {t("analysis.syntheseAndDiagnostic.themePresencePercentage")}
                        >
                          ({weakness.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                    {t("analysis.syntheseAndDiagnostic.themePresencePercentage")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("analysis.syntheseAndDiagnostic.noWeaknesses")}
                </p>
              )}
            </div>

            {/* Top 3 Points forts - DROITE */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {t("analysis.syntheseAndDiagnostic.top3Strengths")}
              </h3>
              {topStrengths.length > 0 ? (
                <div className="space-y-2">
                  {topStrengths.slice(0, 3).map((strength, index) => (
                    <div
                      key={index}
                      onClick={() => handleThemeClick(strength.theme)}
                      className={`flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedTheme === strength.theme 
                          ? 'border-green-400 shadow-md' 
                          : 'border-transparent hover:border-green-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{strength.theme}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <Badge className="bg-green-500 text-white text-xs">
                          {strength.count}
                        </Badge>
                        <span 
                          className="text-xs text-slate-600 dark:text-slate-300"
                          title= {t("analysis.syntheseAndDiagnostic.themePresencePercentage")}
                        >
                          ({strength.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                    {t("analysis.syntheseAndDiagnostic.themePresencePercentage")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("analysis.syntheseAndDiagnostic.noStrengths")}
                </p>
              )}
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
