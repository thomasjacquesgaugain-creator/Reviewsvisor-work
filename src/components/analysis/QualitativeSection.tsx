import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QualitativeData } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { MessageSquare, Star } from "lucide-react";

interface QualitativeSectionProps {
  data: QualitativeData;
}

export function QualitativeSection({ data }: QualitativeSectionProps) {
  const { t } = useTranslation();

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("analysis.qualitative.title", "Analyse qualitative")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <p>{t("analysis.qualitative.noData", "Aucune donnée disponible")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculer la taille des mots pour le nuage (mock)
  const getWordSize = (count: number, maxCount: number) => {
    const minSize = 12;
    const maxSize = 32;
    return minSize + ((count / maxCount) * (maxSize - minSize));
  };

  const topKeywords = data.topKeywords || [];
  const keyVerbatims = data.keyVerbatims || [];
  const maxCount = topKeywords.length > 0 ? Math.max(...topKeywords.map(k => k.count), 1) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("analysis.qualitative.title", "Analyse qualitative")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Nuage de mots */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("analysis.qualitative.wordCloud", "Nuage de mots")}
            </h3>
            {topKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg min-h-[200px] items-center justify-center">
                {topKeywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 rounded"
                    style={{
                      fontSize: `${getWordSize(keyword.count, maxCount)}px`,
                      fontWeight: keyword.count > maxCount * 0.7 ? 'bold' : 'normal',
                      color: `hsl(${220 + index * 30}, 70%, 50%)`
                    }}
                  >
                    {keyword.word} ({keyword.count})
                  </span>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <p>{t("analysis.qualitative.noKeywords", "Aucun mot-clé disponible")}</p>
              </div>
            )}
          </div>

          {/* Verbatims clés */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t("analysis.qualitative.keyVerbatims", "Verbatims clés")}
            </h3>
            {keyVerbatims.length > 0 ? (
              <div className="space-y-3">
                {keyVerbatims.map((verbatim, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Star
                          className={`w-4 h-4 ${
                            verbatim.rating >= 4
                              ? 'text-yellow-500 fill-yellow-500'
                              : verbatim.rating >= 3
                              ? 'text-gray-400'
                              : 'text-red-500'
                          }`}
                        />
                        <span className="text-sm font-medium">
                          {verbatim.rating}/5
                        </span>
                        <Badge
                          variant={
                            verbatim.sentiment === 'positive'
                              ? 'default'
                              : verbatim.sentiment === 'negative'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="ml-2"
                        >
                          {verbatim.sentiment === 'positive'
                            ? t("analysis.qualitative.positive", "Positif")
                            : verbatim.sentiment === 'negative'
                            ? t("analysis.qualitative.negative", "Négatif")
                            : t("analysis.qualitative.neutral", "Neutre")}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                      "{verbatim.text}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <p>{t("analysis.qualitative.noVerbatims", "Aucun verbatim disponible")}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
