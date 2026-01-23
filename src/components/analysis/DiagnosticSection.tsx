import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { DiagnosticSummary, OverviewMetrics, ParetoItem } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { CheckCircle, AlertTriangle, Lightbulb, Star, TrendingUp, Target } from "lucide-react";
import { useState, useMemo } from "react";

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

  // Badge de confiance
  const getConfidenceLevel = (total: number) => {
    if (total < 30) {
      return { 
        label: "Confiance : faible", 
        color: "bg-amber-100 text-amber-700 border-amber-300",
        tooltipTitle: "Pourquoi la confiance est faible ?",
        tooltipText: "Cette analyse est basée sur un nombre limité d'avis. Les tendances observées sont indicatives et peuvent évoluer à mesure que de nouveaux avis sont collectés.",
        tooltipSecondary: "Plus vous recevez d'avis, plus l'analyse devient précise et fiable."
      };
    }
    if (total < 100) {
      return { 
        label: "Confiance : moyenne", 
        color: "bg-blue-100 text-blue-700 border-blue-300",
        tooltipTitle: "Pourquoi la confiance est moyenne ?",
        tooltipText: "Cette analyse est basée sur un volume modéré d'avis. Les tendances observées sont fiables, mais peuvent encore évoluer avec davantage de données.",
        tooltipSecondary: "Plus vous recevez d'avis, plus l'analyse devient précise et fiable."
      };
    }
    return { 
      label: "Confiance : élevée", 
      color: "bg-green-100 text-green-700 border-green-300",
      tooltipTitle: "Pourquoi la confiance est élevée ?",
      tooltipText: "Cette analyse est basée sur un volume important d'avis. Les tendances observées sont fiables et représentatives de l'expérience client globale.",
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
    const strengthsList = mainStrengths.map(s => s.theme).join(" et ");
    
    if (mainStrengths.length === 0) {
      return `Priorité : réduire "${problemName}".`;
    } else if (mainStrengths.length === 1) {
      return `Priorité : réduire "${problemName}", tout en préservant "${strengthsList}".`;
    } else {
      return `Priorité : réduire "${problemName}", tout en préservant "${strengthsList}".`;
    }
  }, [topWeaknesses, topStrengths]);

  // Handler pour clic sur un thème
  const handleThemeClick = (theme: string) => {
    setSelectedTheme(theme === selectedTheme ? null : theme);
    if (onThemeSelect) {
      onThemeSelect(theme);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("analysis.diagnostic.title", "Synthèse & diagnostic")}</CardTitle>
          {totalReviews > 0 && (
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={confidence.color}>
                {confidence.label}
              </Badge>
              <InfoTooltip 
                content={`${confidence.tooltipTitle}\n\n${confidence.tooltipText}\n\nConfiance IA : niveau de fiabilité des résultats selon le volume et la cohérence des avis analysés. Bénéfice : vous savez dans quelle mesure vous pouvez vous appuyer sur les analyses pour prendre des décisions.${confidence.tooltipSecondary ? `\n\n${confidence.tooltipSecondary}` : ''}`}
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
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-600">Note moyenne</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.averageRating.toFixed(1)}/5
                </p>
              </div>
            )}

            {/* % d'avis positifs */}
            {overview && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-600">Avis positifs</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.positivePercentage.toFixed(0)}%
                </p>
              </div>
            )}

            {/* Irritant #1 */}
            {topIssue && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-600">Irritant #1</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 truncate" title={topIssue.name}>
                  {topIssue.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {topIssue.percentage.toFixed(0)}% • {topIssue.count} mentions
                </p>
              </div>
            )}
          </div>

          {/* Résumé */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              {t("analysis.diagnostic.summary", "Résumé")}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {data.summary || t("analysis.diagnostic.noSummary", "Aucun résumé disponible")}
            </p>
          </div>

          {/* Phrase de décision automatique */}
          {decisionPhrase && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-gray-800 font-medium leading-relaxed">
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
                {t("analysis.diagnostic.topWeaknesses", "Top 3 Problèmes prioritaires")}
              </h3>
              {topWeaknesses.length > 0 ? (
                <div className="space-y-2">
                  {topWeaknesses.slice(0, 3).map((weakness, index) => (
                    <div
                      key={index}
                      onClick={() => handleThemeClick(weakness.theme)}
                      className={`flex items-center justify-between p-3 bg-red-50 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedTheme === weakness.theme 
                          ? 'border-red-400 shadow-md' 
                          : 'border-transparent hover:border-red-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">{weakness.theme}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <Badge variant="destructive" className="text-xs">
                          {weakness.count}
                        </Badge>
                        <span 
                          className="text-xs text-gray-600"
                          title="% = part des avis dans lesquels le thème apparaît"
                        >
                          ({weakness.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-2 italic">
                    % = part des avis dans lesquels le thème apparaît
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("analysis.diagnostic.noWeaknesses", "Aucun problème identifié")}
                </p>
              )}
            </div>

            {/* Top 3 Points forts - DROITE */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {t("analysis.diagnostic.topStrengths", "Top 3 Points forts")}
              </h3>
              {topStrengths.length > 0 ? (
                <div className="space-y-2">
                  {topStrengths.slice(0, 3).map((strength, index) => (
                    <div
                      key={index}
                      onClick={() => handleThemeClick(strength.theme)}
                      className={`flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedTheme === strength.theme 
                          ? 'border-green-400 shadow-md' 
                          : 'border-transparent hover:border-green-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">{strength.theme}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <Badge className="bg-green-500 text-white text-xs">
                          {strength.count}
                        </Badge>
                        <span 
                          className="text-xs text-gray-600"
                          title="% = part des avis dans lesquels le thème apparaît"
                        >
                          ({strength.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-2 italic">
                    % = part des avis dans lesquels le thème apparaît
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("analysis.diagnostic.noStrengths", "Aucun point fort identifié")}
                </p>
              )}
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
