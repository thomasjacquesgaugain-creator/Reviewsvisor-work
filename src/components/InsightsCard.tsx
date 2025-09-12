import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ReviewInsight {
  total_count: number;
  avg_rating: number;
  positive_ratio: number;
  top_praises: Array<{
    theme: string;
    examples: string[];
    count: number;
  }>;
  top_issues: Array<{
    theme: string;
    examples: string[];
    count: number;
  }>;
  themes: {
    summary: string;
  };
  updated_at: string;
}

export default function InsightsCard() {
  const [data, setData] = useState<ReviewInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: ue } = await (supabase as any)
          .from("user_establishment")
          .select("place_id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (!ue?.place_id) return;

        const { data: ins } = await (supabase as any)
          .from("review_insights")
          .select("*")
          .eq("user_id", user.id)
          .eq("place_id", ue.place_id)
          .maybeSingle();
        
        setData(ins as ReviewInsight);
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyse IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyse IA</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucune analyse disponible. Cliquez sur "Analyser mes avis" pour commencer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤖 Analyse IA
          <Badge variant="secondary" className="text-xs">
            Mis à jour {new Date(data.updated_at).toLocaleDateString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{data.total_count}</div>
            <div className="text-sm text-muted-foreground">Avis analysés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{data.avg_rating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Note moyenne</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{Math.round(data.positive_ratio * 100)}%</div>
            <div className="text-sm text-muted-foreground">Avis positifs</div>
          </div>
        </div>

        {/* AI Summary */}
        {data.themes?.summary && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">📝 Résumé</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.themes.summary}
            </p>
          </div>
        )}

        {/* Praises and Issues */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              👍 Points forts
            </h4>
            <ul className="space-y-2">
              {(data.top_praises ?? []).slice(0, 4).map((praise, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-sm">{praise.theme}</span>
                  <Badge variant="outline" className="text-xs">
                    {praise.count}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              ⚠️ Points à améliorer
            </h4>
            <ul className="space-y-2">
              {(data.top_issues ?? []).slice(0, 4).map((issue, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-sm">{issue.theme}</span>
                  <Badge variant="outline" className="text-xs">
                    {issue.count}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}