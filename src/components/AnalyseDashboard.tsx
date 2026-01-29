import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnalyseIA } from "@/types/analyse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export function AnalyseDashboard() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const etablissementId = searchParams.get('etablissementId');
  const [analyse, setAnalyse] = useState<AnalyseIA | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAnalyse = async () => {
      if (!etablissementId) return;
      
      setLoading(true);
      try {
        // Colonnes de base uniquement (pas business_type etc.) pour éviter 400 si migration non appliquée
        const { data, error } = await supabase
          .from('review_insights')
          .select('place_id, last_analyzed_at, summary, themes, top_issues, top_praises, total_count, avg_rating, positive_ratio')
          .eq('place_id', etablissementId)
          .order('last_analyzed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error loading analysis:', error);
          return;
        }

        if (data?.summary && typeof data.summary === 'object' && !Array.isArray(data.summary)) {
          const summary = data.summary as any;
          const analyseData: AnalyseIA = {
            id: data.place_id,
            etablissementId: data.place_id,
            createdAt: data.last_analyzed_at || new Date().toISOString(),
            resume: summary.resume || '',
            sentimentGlobal: summary.sentimentGlobal || { score: 0, label: t("dashboard.sentimentNeutral") },
            stats: summary.stats || { totalAvis: 0, moyenne: 0, positifsPct: 0, negatifsPct: 0, periode: {} },
            themes: summary.themes || [],
            elogesTop3: summary.elogesTop3 || [],
            irritantsTop3: summary.irritantsTop3 || [],
            recommandations: summary.recommandations || [],
            tendances: summary.tendances || ''
          };
          setAnalyse(analyseData);
        }
      } catch (error) {
        console.error('Error in loadAnalyse:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyse();
  }, [etablissementId]);

  if (!etablissementId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{t("dashboard.analysisDashboard")}</h1>
        <p className="text-muted-foreground">{t("dashboard.selectEstablishmentToAnalyze")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">{t("dashboard.analysisDashboard")}</h1>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid md:grid-cols-4 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!analyse) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{t("dashboard.analysisDashboard")}</h1>
        <p className="text-muted-foreground">{t("dashboard.noAnalysisAvailable")}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.analysisDashboard")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.summary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap mb-4">{analyse.resume}</p>

          <div className="grid md:grid-cols-4 gap-4">
            <CardStat label={t("dashboard.averageRating")} value={analyse.stats.moyenne.toFixed(2)} />
            <CardStat label={t("dashboard.positivePercentage")} value={`${Math.round(analyse.stats.positifsPct)}%`} />
            <CardStat label={t("dashboard.negativePercentage")} value={`${Math.round(analyse.stats.negatifsPct)}%`} />
            <CardStat 
              label={t("dashboard.sentiment")} 
              value={`${analyse.sentimentGlobal.label} (${(analyse.sentimentGlobal.score*100).toFixed(0)}%)`} 
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <CardList 
          title={t("dashboard.keyThemes")} 
          items={analyse.themes.map(t => `${t.theme} • ${(t.score*100).toFixed(0)}%`)} 
        />
        <CardList title={t("dashboard.trends")} items={[analyse.tendances]} />
        <CardList title={t("dashboard.praisesTop3")} items={analyse.elogesTop3} />
        <CardList title={t("dashboard.irritantsTop3")} items={analyse.irritantsTop3} />
      </div>

      <CardList title={t("dashboard.recommendations")} items={analyse.recommandations} />
    </div>
  );
}

function CardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function CardList({ title, items }: { title: string; items: string[] }) {
  const safeItems = items.filter(Boolean);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-5 space-y-1">
          {safeItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}