import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeAnalysis, Review } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { MessageSquare, Info } from "lucide-react";
import { useAnalysisFilters } from "./AnalysisFiltersContext";
import { useMemo } from "react";

interface ThemesSectionProps {
  data: ThemeAnalysis[];
}

export function ThemesSection({ data }: ThemesSectionProps) {
  const { t } = useTranslation();
  const { filteredReviews } = useAnalysisFilters();

  const effectiveThemes: ThemeAnalysis[] = useMemo(() => {
    // Si aucun avis filtré ou pas de données de thèmes dans les avis, on garde les données agrégées
    if (!filteredReviews || filteredReviews.length === 0) {
      return data;
    }

    // Construire les stats par thème à partir des avis filtrés, si les thèmes sont présents
    const themeMap = new Map<
      string,
      {
        count: number;
        sentimentSum: number;
        sentimentCount: number;
        verbatims: string[];
      }
    >();

    const hasThemesInReviews = filteredReviews.some((r) => r.themes && r.themes.length > 0);

    if (!hasThemesInReviews) {
      return data;
    }

    filteredReviews.forEach((review: Review) => {
      const reviewText = review.texte;
      (review.themes || []).forEach((t) => {
        const key = t.name || "Autre";
        const current = themeMap.get(key) || {
          count: 0,
          sentimentSum: 0,
          sentimentCount: 0,
          verbatims: [],
        };

        current.count += 1;
        if (typeof t.sentimentScore === "number") {
          current.sentimentSum += t.sentimentScore;
          current.sentimentCount += 1;
        } else if (typeof review.sentimentScore === "number") {
          current.sentimentSum += review.sentimentScore;
          current.sentimentCount += 1;
        }

        if (current.verbatims.length < 5 && reviewText) {
          current.verbatims.push(reviewText);
        }

        themeMap.set(key, current);
      });
    });

    if (themeMap.size === 0) {
      return data;
    }

    const recomputed: ThemeAnalysis[] = Array.from(themeMap.entries()).map(
      ([themeName, value]) => {
        const sentimentAvg =
          value.sentimentCount > 0 ? value.sentimentSum / value.sentimentCount : 0;
        // Mapper un score de -1..1 vers 0..1
        const score = (sentimentAvg + 1) / 2;

        return {
          theme: themeName,
          score,
          count: value.count,
          verbatims: value.verbatims,
        };
      }
    );

    // Trier par nombre de mentions décroissant pour rester cohérent
    recomputed.sort((a, b) => b.count - a.count);
    return recomputed;
  }, [data, filteredReviews]);

  // Préparer les données pour le radar chart
  const radarData = (effectiveThemes || [])
    .map((theme) => ({
      theme: theme.theme || "",
      score: Math.round((theme.score || 0) * 100),
      fullMark: 100,
    }))
    .filter((item) => item.theme); // Filtrer les thèmes vides

  const totalThemeMentions = effectiveThemes.reduce((sum, t) => sum + (t.count || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("analysis.themes.title", "Analyse par thèmes")}</CardTitle>
      </CardHeader>
      <CardContent>
        {effectiveThemes && effectiveThemes.length > 0 && radarData.length > 0 ? (
          <div className="space-y-6">
            {/* Radar Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="theme" tick={{ fontSize: 12, fill: '#000000' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#000000' }} />
                  <Radar
                    name={t("analysis.themes.score", "Score des thèmes récurrents")}
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip
                    cursor={false}
                    formatter={(value: any, _name: any, payload: any) => {
                      const themeName = payload?.payload?.theme;
                      const theme = effectiveThemes.find(t => t.theme === themeName);
                      const score = typeof value === "number" ? value : 0;
                      const mentions = theme?.count ?? 0;
                      return [
                        `${score.toFixed(0)}/100 · ${mentions} avis`,
                        t("analysis.themes.scoreTooltipLabel", "Score du thème"),
                      ];
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Micro-légende sous le radar */}
            <div className="flex flex-col gap-1 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Info className="w-3 h-3 text-gray-400" />
                <span>
                  Score sur 100 : combine la fréquence des avis et la tonalité globale.
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Basé sur {totalThemeMentions} avis mentionnant au moins un thème.
              </p>
            </div>

            {/* Liste des thèmes avec scores, fréquence et polarité */}
            <div className="space-y-4">
              {effectiveThemes.map((theme, index) => {
                const scorePercent = Math.round((theme.score || 0) * 100);
                let polarityLabel = "Perception mitigée";
                let polarityClass = "bg-amber-50 text-amber-700 border-amber-200";

                if (scorePercent >= 70) {
                  polarityLabel = "Plutôt positif";
                  polarityClass = "bg-green-50 text-green-700 border-green-200";
                } else if (scorePercent < 40) {
                  polarityLabel = "À surveiller";
                  polarityClass = "bg-red-50 text-red-700 border-red-200";
                }

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{theme.theme}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${polarityClass}`}
                        >
                          {polarityLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span className="font-medium text-gray-800">
                            Score : {scorePercent}%
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                          <span className="text-gray-700">
                            Fréquence : {theme.count}{" "}
                            {t("analysis.themes.mentions", "mentions")}
                          </span>
                        </span>
                      </div>
                    </div>
                    <Progress value={scorePercent} className="h-2" />
                    {theme.verbatims.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t("analysis.themes.examples", "Exemples")}:
                        </p>
                        {theme.verbatims.slice(0, 2).map((verbatim, vIndex) => (
                          <p
                            key={vIndex}
                            className="text-xs text-muted-foreground italic pl-2"
                          >
                            "{verbatim}"
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Séparation entre graphique et commentaires */}
            <div className="pt-6 mt-6">
              {/* Petite ligne décorative centrée */}
              <div className="w-24 h-0.5 bg-gray-300 mx-auto my-4"></div>
              
              {/* Section Commentaires */}
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-yellow-400 pb-1">
                  Commentaires
                </h3>
              </div>
              <div className="text-gray-700 leading-relaxed space-y-3">
                {generateThematicComment(effectiveThemes)}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <p>{t("analysis.themes.noData", "Aucune donnée disponible")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Fonction pour générer un commentaire d'analyse dynamique basé sur les thèmes
function generateThematicComment(themes: ThemeAnalysis[]): JSX.Element {
  if (!themes || themes.length === 0) {
    return <p>Aucune donnée disponible pour générer une analyse.</p>;
  }

  // Trier les thèmes par nombre de mentions (décroissant)
  const sortedByCount = [...themes].sort((a, b) => b.count - a.count);
  const mostMentioned = sortedByCount[0];

  // Identifier les points forts (score > 50%)
  const strengths = themes
    .filter(t => t.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Identifier les axes d'amélioration (score < 30%)
  const improvements = themes
    .filter(t => t.score < 0.3 && t.count > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const paragraphs: JSX.Element[] = [];

  // Paragraphe 1: Thème le plus mentionné
  if (mostMentioned) {
    paragraphs.push(
      <p key="most-mentioned">
        L'analyse de vos avis révèle que <strong className="text-gray-900">{mostMentioned.theme}</strong> est le thème le plus mentionné ({mostMentioned.count} mention{mostMentioned.count > 1 ? 's' : ''}, {Math.round(mostMentioned.score * 100)}% de score).
      </p>
    );
  }

  // Paragraphe 2: Points forts
  if (strengths.length > 0) {
    const strengthsList = strengths.map(s => `${s.theme} (${Math.round(s.score * 100)}%)`);
    const strengthsText = strengthsList.length === 1 
      ? strengthsList[0]
      : strengthsList.slice(0, -1).join(', ') + ' et ' + strengthsList[strengthsList.length - 1];
    
    paragraphs.push(
      <p key="strengths">
        Vos points forts sont <strong className="text-gray-900">{strengthsText}</strong> avec des scores respectifs de {strengths.map(s => `${Math.round(s.score * 100)}%`).join(' et ')}.
      </p>
    );
  }

  // Paragraphe 3: Axes d'amélioration
  if (improvements.length > 0) {
    const improvementList = improvements.map(i => i.theme);
    const improvementText = improvementList.length === 1
      ? improvementList[0]
      : improvementList.slice(0, -1).join(', ') + ' et ' + improvementList[improvementList.length - 1];
    
    paragraphs.push(
      <p key="improvements">
        Le <strong className="text-gray-900">{improvementText}</strong> {improvements.length === 1 ? 'apparaît' : 'apparaissent'} moins fréquemment dans les retours clients ({improvements[0].count} mention{improvements[0].count > 1 ? 's' : ''}, {Math.round(improvements[0].score * 100)}% de score), ce qui peut indiquer un axe d'amélioration ou simplement un sujet moins discuté par vos clients.
      </p>
    );
  } else if (sortedByCount.length > 0) {
    // Si pas d'axes d'amélioration, mentionner le thème le moins mentionné
    const leastMentioned = sortedByCount[sortedByCount.length - 1];
    if (leastMentioned && leastMentioned.count < mostMentioned.count) {
      paragraphs.push(
        <p key="least-mentioned">
          Le <strong className="text-gray-900">{leastMentioned.theme}</strong> apparaît moins fréquemment dans les retours clients ({leastMentioned.count} mention{leastMentioned.count > 1 ? 's' : ''}, {Math.round(leastMentioned.score * 100)}% de score), ce qui peut indiquer un axe d'amélioration ou simplement un sujet moins discuté par vos clients.
        </p>
      );
    }
  }

  return <>{paragraphs}</>;
}
