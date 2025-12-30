import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Star, MessageSquare, Heart, AlertTriangle } from "lucide-react";

interface AnalyticsDashboardProps {
  restaurantData: {
    name: string;
    url: string;
  };
}

export const AnalyticsDashboard = ({ restaurantData }: AnalyticsDashboardProps) => {
  // Données simulées pour la démonstration
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
                <div className="text-2xl font-bold">{mockData.totalReviews}</div>
                <p className="text-xs text-muted-foreground">+12% ce mois</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
                <Star className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {mockData.averageRating}
                  {mockData.recentTrends.rating.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{(mockData.recentTrends.rating.current - mockData.recentTrends.rating.previous).toFixed(1)} depuis le mois dernier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sentiment Positif</CardTitle>
                <Heart className="w-4 h-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {mockData.sentimentDistribution.positive}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +{mockData.recentTrends.sentiment.current - mockData.recentTrends.sentiment.previous}% ce mois
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amélioration Requise</CardTitle>
                <AlertTriangle className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning flex items-center gap-2">
                  {mockData.themes.filter(t => t.sentiment === "negative").length}
                  <TrendingDown className="w-4 h-4 text-destructive" />
                </div>
                <p className="text-xs text-muted-foreground">domaines à améliorer</p>
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
                  <span>{mockData.sentimentDistribution.positive}%</span>
                </div>
                <Progress value={mockData.sentimentDistribution.positive} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-warning">Neutre</span>
                  <span>{mockData.sentimentDistribution.neutral}%</span>
                </div>
                <Progress value={mockData.sentimentDistribution.neutral} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-destructive">Négatif</span>
                  <span>{mockData.sentimentDistribution.negative}%</span>
                </div>
                <Progress value={mockData.sentimentDistribution.negative} className="h-2" />
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
                  {mockData.themes.map((theme, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${getSentimentColor(theme.sentiment)} text-white`}>
                            {getSentimentIcon(theme.sentiment)}
                          </Badge>
                          <span className="font-medium">{theme.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{theme.mentions} mentions</span>
                        </div>
                      </div>
                      <Progress value={theme.score} className="h-2" />
                      <p className="text-xs text-muted-foreground">Score: {theme.score}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mots-clés populaires */}
            <Card>
              <CardHeader>
                <CardTitle>Mots-clés Populaires</CardTitle>
                <CardDescription>
                  Les termes les plus fréquents dans vos avis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockData.topKeywords.map((keyword, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">"{keyword.word}"</span>
                        <Badge variant="outline" className={`${getSentimentColor(keyword.sentiment)} text-white text-xs`}>
                          {keyword.sentiment}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {keyword.count} fois
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};