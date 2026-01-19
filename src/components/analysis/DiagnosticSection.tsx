import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DiagnosticSummary } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";

interface DiagnosticSectionProps {
  data: DiagnosticSummary;
}

export function DiagnosticSection({ data }: DiagnosticSectionProps) {
  const { t } = useTranslation();

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
  const recommendations = data.recommendations || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("analysis.diagnostic.title", "Synthèse & diagnostic")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Résumé */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              {t("analysis.diagnostic.summary", "Résumé")}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {data.summary || t("analysis.diagnostic.noSummary", "Aucun résumé disponible")}
            </p>
          </div>

          {/* Top 3 Forces */}
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
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{strength.theme}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500 text-white">
                        {strength.count} {t("analysis.diagnostic.mentions", "mentions")}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({strength.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("analysis.diagnostic.noStrengths", "Aucun point fort identifié")}
              </p>
            )}
          </div>

          {/* Top 3 Faiblesses */}
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
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="font-medium">{weakness.theme}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        {weakness.count} {t("analysis.diagnostic.mentions", "mentions")}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({weakness.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("analysis.diagnostic.noWeaknesses", "Aucun problème identifié")}
              </p>
            )}
          </div>

          {/* Recommandations */}
          {recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {t("analysis.diagnostic.recommendations", "Recommandations")}
              </h3>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
