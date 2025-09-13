import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Star, MessageSquare, Heart, AlertTriangle } from "lucide-react";
import { useReviewInsights } from "@/hooks/useReviewInsights";

interface AnalyticsDashboardProps {
  restaurantData: {
    name: string;
    url: string;
    place_id: string;
  };
}

export const AnalyticsDashboard = ({ restaurantData }: AnalyticsDashboardProps) => {
  const { loading, summary } = useReviewInsights(restaurantData.place_id);
  
  if (loading) {
    return (
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <div className="text-lg">Chargement des analyses...</div>
        </div>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <div className="text-lg">Aucune analyse disponible. Lance une analyse depuis la page établissement.</div>
        </div>
      </section>
    );
  }

  // Données simulées pour la démonstration - remplacées par les vraies données
  const mockData = {
    totalReviews: 247,
    averageRating: 4.3,
    sentimentDistribution: {
      positive: 68,
      neutral: 23,
      negative: 9
    },
    themes: [
      { name: "Service", sentiment: "positive", score: 85, mentions: 156 },
      { name: "Qualité des plats", sentiment: "positive", score: 82, mentions: 198 },
      { name: "Ambiance", sentiment: "positive", score: 78, mentions: 89 },
      { name: "Prix", sentiment: "neutral", score: 65, mentions: 134 },
      { name: "Temps d'attente", sentiment: "negative", score: 45, mentions: 67 }
    ],
    topKeywords: [
      { word: "délicieux", count: 89, sentiment: "positive" },
      { word: "service rapide", count: 67, sentiment: "positive" },
      { word: "excellent", count: 54, sentiment: "positive" },
      { word: "cher", count: 34, sentiment: "negative" },
      { word: "attente", count: 28, sentiment: "negative" }
    ],
    recentTrends: {
      rating: { current: 4.3, previous: 4.1, trend: "up" },
      sentiment: { current: 68, previous: 62, trend: "up" }
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-success";
      case "negative": return "bg-destructive";
      default: return "bg-warning";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <Heart className="w-4 h-4" />;
      case "negative": return <AlertTriangle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Analyse pour <span className="text-primary">{restaurantData.name}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Voici ce que vos clients disent de votre restaurant
            </p>
          </div>

          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Avis</CardTitle>
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.counts?.total ?? '—'}</div>
                <p className="text-xs text-muted-foreground">échantillon analysé</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
                <Star className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {summary.overall_rating ?? '—'}
                </div>
                <p className="text-xs text-muted-foreground">analysée par IA</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sentiment Positif</CardTitle>
                <Heart className="w-4 h-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {summary.positive_pct != null ? `${summary.positive_pct}%` : '—'}
                </div>
                <p className="text-xs text-muted-foreground">avis positifs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Problèmes Identifiés</CardTitle>
                <AlertTriangle className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning flex items-center gap-2">
                  {summary.top_issues?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">problèmes prioritaires</p>
              </CardContent>
            </Card>
          </div>

          {/* Distribution des sentiments */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution des Sentiments</CardTitle>
              <CardDescription>
                Répartition des avis par sentiment analysé par l'IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-success">Positif</span>
                  <span>{summary.positive_pct ?? 0}%</span>
                </div>
                <Progress value={summary.positive_pct ?? 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-destructive">Négatif</span>
                  <span>{summary.negative_pct ?? 0}%</span>
                </div>
                <Progress value={summary.negative_pct ?? 0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Thèmes principaux */}
            <Card>
              <CardHeader>
                <CardTitle>Thèmes Principaux</CardTitle>
                <CardDescription>
                  Les sujets les plus mentionnés dans vos avis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Top Issues */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-destructive">Problèmes prioritaires</h4>
                    {summary.top_issues?.length ? summary.top_issues.map((issue, index) => (
                      <div key={index} className="p-3 rounded-lg bg-red-50 border border-red-200">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="font-medium">{issue.label}</span>
                        </div>
                        {issue.why && <p className="text-sm text-gray-600 mt-1">{issue.why}</p>}
                      </div>
                    )) : <p className="text-sm text-muted-foreground">Aucun problème critique identifié</p>}
                  </div>
                  
                  {/* Top Strengths */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-success">Points forts</h4>
                    {summary.top_strengths?.length ? summary.top_strengths.map((strength, index) => (
                      <div key={index} className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{strength.label}</span>
                        </div>
                        {strength.why && <p className="text-sm text-gray-600 mt-1">{strength.why}</p>}
                      </div>
                    )) : <p className="text-sm text-muted-foreground">Aucun point fort spécifique identifié</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mots-clés populaires */}
            <Card>
              <CardHeader>
                <CardTitle>Recommandations IA</CardTitle>
                <CardDescription>
                  Actions concrètes suggérées par l'analyse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.recommendations?.length ? summary.recommendations.map((reco, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-sm">{reco}</span>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">Aucune recommandation disponible</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};