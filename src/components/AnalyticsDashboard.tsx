import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Star, MessageSquare, Heart, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AnalyticsDashboardProps {
  restaurantData: {
    name: string;
    url: string;
  };
}

export const AnalyticsDashboard = ({ restaurantData }: AnalyticsDashboardProps) => {
  const { t } = useTranslation();

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
      { name: t("demoAnalytics.themes.service"), sentiment: "positive", score: 85, mentions: 156 },
      { name: t("demoAnalytics.themes.foodQuality"), sentiment: "positive", score: 82, mentions: 198 },
      { name: t("demoAnalytics.themes.ambiance"), sentiment: "positive", score: 78, mentions: 89 },
      { name: t("demoAnalytics.themes.price"), sentiment: "neutral", score: 65, mentions: 134 },
      { name: t("demoAnalytics.themes.waitTime"), sentiment: "negative", score: 45, mentions: 67 }
    ],
    topKeywords: [
      { word: t("demoAnalytics.keywords.delicious"), count: 89, sentiment: "positive" },
      { word: t("demoAnalytics.keywords.fastService"), count: 67, sentiment: "positive" },
      { word: t("demoAnalytics.keywords.excellent"), count: 54, sentiment: "positive" },
      { word: t("demoAnalytics.keywords.expensive"), count: 34, sentiment: "negative" },
      { word: t("demoAnalytics.keywords.wait"), count: 28, sentiment: "negative" }
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
              {t("demoAnalytics.headerTitle")} <span className="text-primary">{restaurantData.name}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("demoAnalytics.headerSubtitle")}
            </p>
          </div>

          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("demoAnalytics.totalReviews")}</CardTitle>
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockData.totalReviews}</div>
                <p className="text-xs text-muted-foreground">{t("demoAnalytics.thisMonthChange", { value: 12 })}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("demoAnalytics.averageRating")}</CardTitle>
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
                  {t("demoAnalytics.ratingDeltaSinceLastMonth", { value: (mockData.recentTrends.rating.current - mockData.recentTrends.rating.previous).toFixed(1) })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("demoAnalytics.positiveSentiment")}</CardTitle>
                <Heart className="w-4 h-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {mockData.sentimentDistribution.positive}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("demoAnalytics.thisMonthChange", { value: mockData.recentTrends.sentiment.current - mockData.recentTrends.sentiment.previous })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("demoAnalytics.improvementRequired")}</CardTitle>
                <AlertTriangle className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning flex items-center gap-2">
                  {mockData.themes.filter(t => t.sentiment === "negative").length}
                  <TrendingDown className="w-4 h-4 text-destructive" />
                </div>
                <p className="text-xs text-muted-foreground">{t("demoAnalytics.areasToImprove")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Distribution des sentiments */}
          <Card>
            <CardHeader>
              <CardTitle>{t("demoAnalytics.sentimentDistribution")}</CardTitle>
              <CardDescription>
                {t("demoAnalytics.sentimentDistributionDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-success">{t("sentiment.positive")}</span>
                  <span>{mockData.sentimentDistribution.positive}%</span>
                </div>
                <Progress value={mockData.sentimentDistribution.positive} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-warning">{t("sentiment.neutral")}</span>
                  <span>{mockData.sentimentDistribution.neutral}%</span>
                </div>
                <Progress value={mockData.sentimentDistribution.neutral} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-destructive">{t("sentiment.negative")}</span>
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
                <CardTitle>{t("demoAnalytics.mainThemes")}</CardTitle>
                <CardDescription>
                  {t("demoAnalytics.mainThemesDesc")}
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
                          <span>{t("demoAnalytics.mentionsCount", { count: theme.mentions })}</span>
                        </div>
                      </div>
                      <Progress value={theme.score} className="h-2" />
                      <p className="text-xs text-muted-foreground">{t("demoAnalytics.score", { value: theme.score })}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mots-clés populaires */}
            <Card>
              <CardHeader>
                <CardTitle>{t("demoAnalytics.popularKeywords")}</CardTitle>
                <CardDescription>
                  {t("demoAnalytics.popularKeywordsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockData.topKeywords.map((keyword, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">"{keyword.word}"</span>
                        <Badge variant="outline" className={`${getSentimentColor(keyword.sentiment)} text-white text-xs`}>
                          {t(`sentiment.${keyword.sentiment}`)}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {t("demoAnalytics.timesCount", { count: keyword.count })}
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