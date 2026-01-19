import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeAnalysis } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ThemesSectionProps {
  data: ThemeAnalysis[];
}

export function ThemesSection({ data }: ThemesSectionProps) {
  const { t } = useTranslation();

  // Préparer les données pour le radar chart
  const radarData = (data || []).map(theme => ({
    theme: theme.theme || '',
    score: Math.round((theme.score || 0) * 100),
    fullMark: 100
  })).filter(item => item.theme); // Filtrer les thèmes vides

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("analysis.themes.title", "Analyse par thématiques")}</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 && radarData.length > 0 ? (
          <div className="space-y-6">
            {/* Radar Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="theme" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name={t("analysis.themes.score", "Score")}
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip cursor={false} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Liste des thèmes avec scores */}
            <div className="space-y-4">
              {data.map((theme, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{theme.theme}</span>
                      <Badge variant="secondary">
                        {Math.round(theme.score * 100)}%
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {theme.count} {t("analysis.themes.mentions", "mentions")}
                    </span>
                  </div>
                  <Progress value={theme.score * 100} className="h-2" />
                  {theme.verbatims.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("analysis.themes.examples", "Exemples")}:
                      </p>
                      {theme.verbatims.slice(0, 2).map((verbatim, vIndex) => (
                        <p key={vIndex} className="text-xs text-muted-foreground italic pl-2">
                          "{verbatim}"
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
