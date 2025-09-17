import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Star, TrendingUp, BarChart3, Building2, MessageSquareText, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { getReviewsSummary, listAllReviews, listAll } from "@/services/reviewsService";
import { STORAGE_KEY } from "@/types/etablissement";
import { ReviewsTable, ReviewsTableRow } from "@/components/reviews/ReviewsTable";
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
          authorName: review.author || "Anonyme",
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

  // Écoute l'évènement envoyé après import pour recharger
  useEffect(() => {
    const onImported = (e: any) => {
      const id = e?.detail?.establishmentId;
      if (!id || id !== effectiveId) return;
      
      const loadData = async () => {
        try {
          setIsLoadingReviews(true);
          const allReviews = await listAll(effectiveId!);
          
          // Map ALL reviews to table format
          const mappedRows: ReviewsTableRow[] = allReviews.map(review => ({
            authorName: review.author || "Anonyme",
            rating: review.rating || 0,
            comment: review.text || "",
            platform: review.source || "Google",
            reviewDate: review.published_at ? new Date(review.published_at).toLocaleDateString('fr-FR') : null
          }));
          
          setReviewsList(mappedRows);
        } catch (error) {
          console.error('Error loading reviews after import:', error);
        } finally {
          setIsLoadingReviews(false);
        }
      };
      
      loadData();
    };

    window.addEventListener("reviews:imported", onImported);
    return () => window.removeEventListener("reviews:imported", onImported);
  }, [effectiveId]);

  // Écouter l'événement de suppression des avis
  useEffect(() => {
    const onDeleted = (e: any) => {
      const id = e?.detail?.establishmentId;
      if (!id || id !== effectiveId) return;
      
      // Recharger complètement les données
      const loadData = async () => {
        try {
          setIsLoading(true);
          setIsLoadingReviews(true);
          
          const [summaryData, allReviews] = await Promise.all([
            getReviewsSummary(effectiveId!),
            listAll(effectiveId!)
          ]);
          
          setSummary(summaryData);
          
          const mappedRows: ReviewsTableRow[] = allReviews.map(review => ({
            authorName: review.author || "Anonyme",
            rating: review.rating || 0,
            comment: review.text || "",
            platform: review.source || "Google",
            reviewDate: review.published_at ? new Date(review.published_at).toLocaleDateString('fr-FR') : null
          }));
          
          setReviewsList(mappedRows);
        } catch (error) {
          console.error('Error loading reviews after deletion:', error);
        } finally {
          setIsLoading(false);
          setIsLoadingReviews(false);
        }
      };
      
      loadData();
    };

    window.addEventListener("reviews:deleted", onDeleted);
    return () => window.removeEventListener("reviews:deleted", onDeleted);
  }, [effectiveId]);

  const handleDeleteAllReviews = async () => {
    if (!effectiveId) return;

    try {
      setIsDeleting(true);
      
      const response = await fetch('/api/avis/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ establishmentId: effectiveId }),
        cache: 'no-store',
      });

      const text = await response.text();
      const json = (() => { 
        try { 
          return JSON.parse(text); 
        } catch { 
          return {}; 
        } 
      })();

      if (!response.ok) {
        throw new Error(json?.error || text || `HTTP ${response.status}`);
      }

      const deleted = json?.deleted ?? 0;
      
      toast.success(`🗑️ ${deleted} avis supprimés`);
      
      // Réinitialiser l'état local immédiatement
      setSummary({
        total: 0,
        avgRating: 0,
        byStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        byMonth: []
      });
      setReviewsList([]);
      
      // Recharger les données depuis le serveur avec cache-busting
      try {
        const cacheBuster = `?t=${Date.now()}`;
        const [summaryData, allReviews] = await Promise.all([
          getReviewsSummary(effectiveId + cacheBuster),
          listAll(effectiveId + cacheBuster)
        ]);
        
        setSummary(summaryData);
        
        const mappedRows: ReviewsTableRow[] = allReviews.map(review => ({
          authorName: review.author || "Anonyme",
          rating: review.rating || 0,
          comment: review.text || "",
          platform: review.source || "Google",
          reviewDate: review.published_at ? new Date(review.published_at).toLocaleDateString('fr-FR') : null
        }));
        
        setReviewsList(mappedRows);
      } catch (refreshError) {
        console.error('Error refreshing data after delete:', refreshError);
      }
      
      // Émettre un événement pour notifier la suppression
      window.dispatchEvent(new CustomEvent("reviews:purged", { 
        detail: { establishmentId: effectiveId } 
      }));
      
    } catch (error) {
      console.error('Purge error:', error);
      toast.error(`❌ Erreur lors de la suppression : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Fonction de diagnostic (pour debug)
  const handleInspect = async () => {
    if (!effectiveId) return;
    
    try {
      const response = await fetch(`/api/avis/inspect?establishmentId=${effectiveId}`);
      const data = await response.json();
      console.log('Inspection results:', data);
      toast.info('Résultats du diagnostic dans la console');
    } catch (error) {
      console.error('Inspect error:', error);
      toast.error('Erreur lors du diagnostic');
    }
  };

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
              
              <Card className="relative">
                <CardContent className="flex items-center p-4" data-testid="metric-total-reviews">
                  <BarChart3 className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total d'avis</p>
                    <p className="text-2xl font-bold">{summary.total}</p>
                  </div>
                  {summary.total > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-1 right-8 h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={handleInspect}
                        title="Diagnostiquer (console)"
                      >
                        🔍
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-1 right-1 h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isDeleting}
                        data-testid="btn-purge-reviews"
                        title="Supprimer tous les avis"
                        aria-label="Supprimer tous les avis"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

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

            {/* Reviews List */}
            <div>
              <ReviewsTable
                rows={reviewsList}
                isLoading={isLoadingReviews}
                emptyLabel="Aucun avis enregistré"
                data-testid="establishment-reviews-table"
              />
            </div>
          </>}
      </CardContent>

      {/* AlertDialog for delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer tous les avis</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer TOUS les avis de « {displayName} » ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowDeleteDialog(false);
                await handleDeleteAllReviews();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>;
}