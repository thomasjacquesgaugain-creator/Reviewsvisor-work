import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Star, TrendingUp, BarChart3, Building2, MessageSquareText, Trash2, ThumbsUp, ThumbsDown, ShieldAlert, List } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { getReviewsSummary, listAllReviews, listAll, deleteAllReviews } from "@/services/reviewsService";
import { STORAGE_KEY } from "@/types/etablissement";
import { ReviewsTable, ReviewsTableRow } from "@/components/reviews/ReviewsTable";
import { toast as sonnerToast } from "sonner";
import { getDisplayAuthor } from "@/utils/getDisplayAuthor";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ReviewFilter = "all" | "positive" | "negative" | "suspect";

interface ReviewsSummary {
  total: number;
  avgRating: number;
  byStars: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  byMonth: Array<{
    month: string;
    count: number;
    avg?: number;
  }>;
}

interface ReviewsVisualPanelProps {
  establishmentId?: string;
  establishmentName?: string;
  onClose: () => void;
}

// Heuristique simple pour détecter les avis suspects
function isSuspectReview(comment: string, rating: number): boolean {
  if (!comment) return false;
  const trimmed = comment.trim();
  
  // Commentaire très court (moins de 15 caractères)
  if (trimmed.length < 15 && trimmed.length > 0) return true;
  
  // Commentaires génériques courants
  const genericPatterns = [
    /^(super|top|genial|parfait|excellent|nul|mauvais|bien|bof)\.?$/i,
    /^(très bien|pas mal|à éviter|je recommande|recommande)\.?$/i,
    /^\.+$/,
    /^[👍👎❤️⭐️🌟]+$/,
  ];
  
  if (genericPatterns.some(pattern => pattern.test(trimmed))) return true;
  
  // Note extrême (1 ou 5) avec commentaire très court
  if ((rating === 1 || rating === 5) && trimmed.length < 30) return true;
  
  return false;
}

export function ReviewsVisualPanel({
  establishmentId,
  establishmentName,
  onClose
}: ReviewsVisualPanelProps) {
  const [summary, setSummary] = useState<ReviewsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsList, setReviewsList] = useState<ReviewsTableRow[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>("all");
  const currentEstablishment = useCurrentEstablishment();
  
  // Use props first, fallback to current establishment
  const effectiveId = establishmentId || currentEstablishment?.id || currentEstablishment?.place_id;
  const displayName = establishmentName ?? currentEstablishment?.name ?? "—";
  useEffect(() => {
    const loadData = async () => {
      if (!effectiveId) {
        setIsLoading(false);
        setIsLoadingReviews(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setIsLoadingReviews(true);
        
        // Load summary and ALL reviews in parallel
        const [summaryData, allReviews] = await Promise.all([
          getReviewsSummary(effectiveId),
          listAll(effectiveId)
        ]);
        
        setSummary(summaryData);
        
        // Map ALL reviews to table format
        const mappedRows: ReviewsTableRow[] = allReviews.map(review => ({
          authorName: getDisplayAuthor(review),
          rating: review.rating || 0,
          comment: review.text || "",
          platform: review.source || "Google",
          reviewDate: review.published_at ? new Date(review.published_at).toLocaleDateString('fr-FR') : null
        }));
        
        setReviewsList(mappedRows);
      } catch (error) {
        console.error("Error loading reviews data:", error);
        setSummary(null);
        setReviewsList([]);
      } finally {
        setIsLoading(false);
        setIsLoadingReviews(false);
      }
    };
    
    loadData();
  }, [effectiveId]);

  // Function to reload data
  const reloadData = async () => {
    if (!effectiveId) return;
    
    try {
      setIsLoading(true);
      setIsLoadingReviews(true);
      
      // Load summary and ALL reviews in parallel
      const [summaryData, allReviews] = await Promise.all([
        getReviewsSummary(effectiveId),
        listAll(effectiveId)
      ]);
      
      setSummary(summaryData);
      
      // Map ALL reviews to table format
      const mappedRows: ReviewsTableRow[] = allReviews.map(review => ({
        authorName: getDisplayAuthor(review),
        rating: review.rating || 0,
        comment: review.text || "",
        platform: review.source || "Google",
        reviewDate: review.published_at ? new Date(review.published_at).toLocaleDateString('fr-FR') : null
      }));
      
      setReviewsList(mappedRows);
    } catch (error) {
      console.error("Error reloading data:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingReviews(false);
    }
  };

  // Function to handle delete all reviews
  const handleDeleteAllReviews = async () => {
    if (!effectiveId) return;
    
    try {
      setIsDeleting(true);
      await deleteAllReviews(effectiveId);
      
      // Toast rouge en bas à droite (même système que import CSV/JSON)
      sonnerToast.error("Tous les avis de l'établissement ont été supprimés.", {
        duration: 5000,
      });
      
      // Reload the data to update UI
      await reloadData();
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('Error deleting reviews:', error);
      
      // Toast d'erreur rouge en bas à droite
      sonnerToast.error("Une erreur est survenue lors de la suppression des avis.", {
        duration: 5000,
      });
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Écoute l'évènement envoyé après import pour recharger
  useEffect(() => {
    const onImported = (e: any) => {
      const id = e?.detail?.establishmentId;
      if (!id || id !== effectiveId) return;
      
      reloadData();
    };

    window.addEventListener("reviews:imported", onImported);
    return () => window.removeEventListener("reviews:imported", onImported);
  }, [effectiveId]);

  // Fallback: read the last selected establishment name from localStorage
  const fallbackName = (() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const est = JSON.parse(stored);
        return est?.name as string;
      }
    } catch {}
    return null;
  })();

  if (!effectiveId && displayName === "—") {
    return <Card className="relative z-20 max-w-4xl mx-auto" data-testid="reviews-visual-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Aperçu visuel des avis — {fallbackName || "—"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="btn-close-reviews-visual">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {fallbackName || "Aucun établissement sélectionné"}
          </p>
        </CardContent>
      </Card>;
  }
  const starsData = summary ? [{
    stars: "5 étoiles",
    count: summary.byStars[5]
  }, {
    stars: "4 étoiles",
    count: summary.byStars[4]
  }, {
    stars: "3 étoiles",
    count: summary.byStars[3]
  }, {
    stars: "2 étoiles",
    count: summary.byStars[2]
  }, {
    stars: "1 étoile",
    count: summary.byStars[1]
  }] : [];
  return <Card className="relative z-20 max-w-4xl mx-auto" data-testid="reviews-visual-panel">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" aria-hidden="true" />
              <h3 className="text-xl font-semibold" data-testid="establishment-title">
                {displayName}
              </h3>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              <span data-testid="establishment-subtitle">Avis de l'établissement</span>
            </div>
          </div>

          {/* Bouton fermer : ne pas modifier la logique existante */}
          <Button onClick={onClose} variant="ghost" size="icon" data-testid="btn-close-reviews-visual">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading ? <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div> : !summary || summary.total === 0 ? <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{displayName}, 0 avis</h3>
            <p className="text-muted-foreground">
              Aucun avis enregistré pour cet établissement. Importez des avis pour voir les statistiques.
            </p>
          </div> : <>
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
                <CardContent className="flex items-center justify-between p-4" data-testid="metric-total-reviews">
                  <div className="flex items-center">
                    <BarChart3 className="w-8 h-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total d'avis</p>
                      <p className="text-2xl font-bold">{summary.total}</p>
                    </div>
                  </div>
                  {summary.total > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid="btn-delete-all-reviews"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting}
                      title="Supprimer tous les avis"
                    >
                      <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cards de filtrage */}
            {(() => {
              const totalCount = reviewsList.length;
              const positiveCount = reviewsList.filter(r => r.rating >= 4).length;
              const negativeCount = reviewsList.filter(r => r.rating <= 2).length;
              const suspectCount = reviewsList.filter(r => isSuspectReview(r.comment, r.rating)).length;
              
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Tous les avis */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'all' ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                    onClick={() => setActiveFilter('all')}
                  >
                    <CardContent className="flex items-center p-4">
                      <List className="w-8 h-8 text-primary mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tous les avis</p>
                        <p className="text-2xl font-bold">{totalCount}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Avis positifs */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'positive' ? 'ring-2 ring-green-500 bg-green-500/5' : ''}`}
                    onClick={() => setActiveFilter('positive')}
                  >
                    <CardContent className="flex items-center p-4">
                      <ThumbsUp className="w-8 h-8 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Avis positifs</p>
                        <p className="text-2xl font-bold">{positiveCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Avis négatifs */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'negative' ? 'ring-2 ring-red-500 bg-red-500/5' : ''}`}
                    onClick={() => setActiveFilter('negative')}
                  >
                    <CardContent className="flex items-center p-4">
                      <ThumbsDown className="w-8 h-8 text-red-500 mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Avis négatifs</p>
                        <p className="text-2xl font-bold">{negativeCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Suspicion faux avis */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'suspect' ? 'ring-2 ring-orange-500 bg-orange-500/5' : ''}`}
                    onClick={() => setActiveFilter('suspect')}
                  >
                    <CardContent className="flex items-center p-4">
                      <ShieldAlert className="w-8 h-8 text-orange-500 mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Suspicion faux avis</p>
                        <p className="text-2xl font-bold">{suspectCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Stars Distribution */}
            

            {/* Monthly Trend */}
            {summary.byMonth.length > 0 && <div>
                <h3 className="text-lg font-medium mb-4">Tendance mensuelle (12 derniers mois)</h3>
                <div className="h-64" data-testid="chart-monthly-trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary.byMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip labelFormatter={value => `Mois: ${value}`} formatter={(value, name) => [value, name === 'count' ? 'Nombre d\'avis' : 'Note moyenne']} />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                      {summary.byMonth.some(m => m.avg) && <Line type="monotone" dataKey="avg" stroke="hsl(var(--destructive))" strokeWidth={2} />}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>}

            {/* Reviews List with Filter */}
            <div>
              <Badge variant="secondary" className="text-sm mb-4">
                Filtre : {activeFilter === 'all' ? 'tous les avis' :
                         activeFilter === 'positive' ? 'avis positifs (≥ 4 étoiles)' : 
                         activeFilter === 'negative' ? 'avis négatifs (≤ 2 étoiles)' : 
                         'avis suspects'}
              </Badge>
              <ReviewsTable
                rows={(() => {
                  switch (activeFilter) {
                    case 'positive':
                      return reviewsList.filter(r => r.rating >= 4);
                    case 'negative':
                      return reviewsList.filter(r => r.rating <= 2);
                    case 'suspect':
                      return reviewsList.filter(r => isSuspectReview(r.comment, r.rating));
                    default:
                      return reviewsList;
                  }
                })()}
                isLoading={isLoadingReviews}
                emptyLabel={activeFilter === 'all' ? "Aucun avis enregistré" : "Aucun avis correspondant au filtre"}
                data-testid="establishment-reviews-table"
              />
            </div>
          </>}
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer tous les avis de cet établissement ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllReviews}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>;
}