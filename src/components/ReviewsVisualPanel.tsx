import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Star, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { getReviewsSummary, getRecentReviews, type RecentReview } from "@/services/reviewsService";

interface ReviewsSummary {
  total: number;
  avgRating: number;
  byStars: { 1: number; 2: number; 3: number; 4: number; 5: number };
  byMonth: Array<{ month: string; count: number; avg?: number }>;
}

interface ReviewsVisualPanelProps {
  establishmentId?: string;
  onClose: () => void;
}

export function ReviewsVisualPanel({ establishmentId, onClose }: ReviewsVisualPanelProps) {
  const [summary, setSummary] = useState<ReviewsSummary | null>(null);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentEstablishment = useCurrentEstablishment();
  
  // Use passed establishmentId or fall back to currentEstablishment
  const targetEstablishmentId = establishmentId || currentEstablishment?.place_id;

  useEffect(() => {
    const loadData = async () => {
      if (!targetEstablishmentId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Load summary and recent reviews in parallel
        const [summaryData, recentData] = await Promise.all([
          getReviewsSummary(targetEstablishmentId),
          getRecentReviews(targetEstablishmentId, 20)
        ]);
        setSummary(summaryData);
        setRecentReviews(recentData);
      } catch (error) {
        console.error("Error loading reviews data:", error);
        setSummary(null);
        setRecentReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [targetEstablishmentId]);

  if (!targetEstablishmentId) {
    return (
      <Card className="relative z-20 max-w-4xl mx-auto" data-testid="reviews-visual-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Aperçu visuel des avis
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            data-testid="btn-close-reviews-visual"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Établissement introuvable</h3>
            <p className="text-muted-foreground">
              Impossible de charger les données pour cet établissement.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const starsData = summary ? [
    { stars: "5 étoiles", count: summary.byStars[5] },
    { stars: "4 étoiles", count: summary.byStars[4] },
    { stars: "3 étoiles", count: summary.byStars[3] },
    { stars: "2 étoiles", count: summary.byStars[2] },
    { stars: "1 étoile", count: summary.byStars[1] },
  ] : [];

  return (
    <Card className="relative z-20 max-w-4xl mx-auto" data-testid="reviews-visual-panel">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Aperçu visuel des avis
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          data-testid="btn-close-reviews-visual"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : !summary || summary.total === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun avis enregistré</h3>
            <p className="text-muted-foreground">
              Aucun avis enregistré pour cet établissement. Importez des avis pour voir les statistiques.
            </p>
          </div>
        ) : (
          <>
            {/* Header Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="flex items-center p-4" data-testid="metric-avg-rating">
                  <Star className="w-8 h-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Note moyenne</p>
                    <p className="text-2xl font-bold">{summary.avgRating.toFixed(1)}/5</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center p-4" data-testid="metric-total-reviews">
                  <BarChart3 className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total d'avis</p>
                    <p className="text-2xl font-bold">{summary.total}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stars Distribution */}
            <div>
              <h3 className="text-lg font-medium mb-4">Répartition par étoiles</h3>
              <div className="h-64" data-testid="chart-stars-distribution">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={starsData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stars" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend */}
            {summary.byMonth.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Tendance mensuelle (12 derniers mois)</h3>
                <div className="h-64" data-testid="chart-monthly-trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary.byMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => `Mois: ${value}`}
                        formatter={(value, name) => [
                          value, 
                          name === 'count' ? 'Nombre d\'avis' : 'Note moyenne'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.3}
                      />
                      {summary.byMonth.some(m => m.avg) && (
                        <Line 
                          type="monotone" 
                          dataKey="avg" 
                          stroke="hsl(var(--destructive))" 
                          strokeWidth={2}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Reviews Table */}
            {recentReviews.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Avis récents</h3>
                <div className="border rounded-lg" data-testid="recent-reviews-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Auteur</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Commentaire</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentReviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">
                            {review.author || "Anonyme"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              {review.rating}/5
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="line-clamp-3 text-sm">
                              {review.text || "Aucun commentaire"}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {review.source}
                          </TableCell>
                          <TableCell>
                            {review.published_at 
                              ? new Date(review.published_at).toLocaleDateString('fr-FR')
                              : "—"
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}