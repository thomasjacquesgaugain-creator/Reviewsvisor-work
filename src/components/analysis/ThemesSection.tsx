import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeAnalysis, Review } from "@/types/analysis";
import { useTranslation,Trans } from "react-i18next";
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

  const getScoreTone = () => {
    return {
      labelClassName: "text-slate-700 dark:text-slate-300",
      valueClassName: "text-primary",
    };
  };

  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
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
                  <PolarAngleAxis dataKey="theme" tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
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
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;

                      const rawScore = payload[0]?.value;
                      const score = typeof rawScore === "number" ? rawScore : 0;
                      const themeName = payload[0]?.payload?.theme || "";
                      const theme = effectiveThemes.find((item) => item.theme === themeName);
                      const mentions = theme?.count ?? 0;
                      const tone = getScoreTone();

                      return (
                        <div className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                            {themeName}
                          </p>
                          <div className="mt-1 flex items-baseline justify-between gap-3">
                            <span className={`text-xs font-medium ${tone.labelClassName}`}>
                              {t("analysis.themes.scoreTooltipLabel")}
                            </span>
                            <span className={`text-sm font-bold ${tone.valueClassName}`}>
                              {t("analysis.themes.scoreTooltipValue", {
                                score: score.toFixed(0),
                                mentions,
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Micro-légende sous le radar */}
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Info className="w-3 h-3 text-muted-foreground" />
                <span>
                 {t("analysis.themes.scoreExplanation")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                  {t("analysis.themes.basedOnMentions", { count: totalThemeMentions })}
              </p>
            </div>

            {/* Liste des thèmes avec scores, fréquence et polarité */}
            <div className="space-y-4">
              {effectiveThemes.map((theme, index) => {
                const scorePercent = Math.round((theme.score || 0) * 100);
                let polarityLabel = t("analysis.themes.polarity.mixed");
                let polarityClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50";

                if (scorePercent >= 70) {
                  polarityLabel = t("analysis.themes.polarity.positive");
                  polarityClass = "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/50";
                } else if (scorePercent < 40) {
                  polarityLabel = t("analysis.themes.polarity.toWatch");
                  polarityClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50";
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {t("analysis.themes.score")}: {scorePercent}%
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {t("analysis.themes.frequency")}: {theme.count}{" "}
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
              <div className="w-24 h-0.5 bg-slate-300 dark:bg-slate-700 mx-auto my-4"></div>
              
              {/* Section Commentaires */}
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b-2 border-yellow-400 pb-1">
                  {t("analysis.themes.comments")}
                </h3>
              </div>
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
                {generateThematicComment(effectiveThemes,t)}
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
function generateThematicComment(themes: ThemeAnalysis[],t: (key: string, opts?: any) => string): JSX.Element {
  if (!themes || themes.length === 0) {
    return <p>{t("analysis.themes.noData")}</p>;
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
        <Trans
          i18nKey="analysis.themes.comment.mostMentioned"
          values={{
            theme: mostMentioned.theme,
            count: mostMentioned.count,
            score: Math.round(mostMentioned.score * 100),
          }}
          components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
        />      
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
        <Trans
          i18nKey="analysis.themes.comment.strengths"
          values={{ list: strengthsList }}
          components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
        />    
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
        <Trans
          i18nKey="analysis.themes.comment.improvements"
          values={{
            theme: improvements[0].theme,
            count: improvements[0].count,
            score: Math.round(improvements[0].score * 100),
          }}
          components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
        />      
      </p>
    );
  } else if (sortedByCount.length > 0) {
    // Si pas d'axes d'amélioration, mentionner le thème le moins mentionné
    const leastMentioned = sortedByCount[sortedByCount.length - 1];
    if (leastMentioned && leastMentioned.count < mostMentioned.count) {
      paragraphs.push(
        <p key="least-mentioned">
          <Trans
            i18nKey="analysis.themes.comment.leastMentioned"
            values={{
              theme: leastMentioned.theme,
              count: leastMentioned.count,
              score: Math.round(leastMentioned.score * 100),
            }}
            components={{ bold: <strong className="text-slate-900 dark:text-slate-100" /> }}
          />        
        </p>
      );
    }
  }

  return <>{paragraphs}</>;
}
