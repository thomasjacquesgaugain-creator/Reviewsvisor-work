import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Star, TrendingUp, BarChart3, Building2, MessageSquareText, Trash2, ThumbsUp, ThumbsDown, ShieldAlert, List, LineChart, PieChart, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { getReviewsSummary, listAllReviews, listAll, deleteAllReviews, verifyAndRestoreCreateTimes } from "@/services/reviewsService";
import { STORAGE_KEY } from "@/types/etablissement";
import { ReviewsTable, ReviewsTableRow } from "@/components/reviews/ReviewsTable";
import { toast as sonnerToast } from "sonner";
import { getDisplayAuthor } from "@/utils/getDisplayAuthor";
import { Badge } from "@/components/ui/badge";
import { TrendModal } from "@/components/TrendModal";
import { RatingDistributionModal } from "@/components/RatingDistributionModal";
import { extractOriginalText } from "@/utils/extractOriginalText";
import { formatReviewDate } from "@/utils/formatReviewDate";
import { useTranslation } from "react-i18next";
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
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [showRatingDistributionModal, setShowRatingDistributionModal] = useState(false);
  const [displayCount, setDisplayCount] = useState(10);
  const currentEstablishment = useCurrentEstablishment();
  const { t } = useTranslation();
  
  // Use props first, fallback to current establishment
  const effectiveId = establishmentId || currentEstablishment?.id || currentEstablishment?.place_id;
  const displayName = establishmentName ?? currentEstablishment?.name ?? null;
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
        
        // RÈGLE CRITIQUE : Vérifier et restaurer createTime au chargement
        await verifyAndRestoreCreateTimes(effectiveId);
        
        // Load summary and ALL reviews in parallel
        const [summaryData, allReviews] = await Promise.all([
          getReviewsSummary(effectiveId),
          listAll(effectiveId)
        ]);
        
        setSummary(summaryData);
        
        // VÉRIFICATION CRITIQUE : Vérifier que chaque avis a son createTime
        const reviewsWithoutCreateTime = allReviews.filter(r => {
          const hasCreateTime = r.create_time || r.raw?.createTime || r.raw?.originalCreateTime || r.published_at;
          return !hasCreateTime;
        });
        
        if (reviewsWithoutCreateTime.length > 0) {
          console.error(`❌ ERREUR CRITIQUE : ${reviewsWithoutCreateTime.length} avis sans createTime!`, reviewsWithoutCreateTime);
        }
        
        // Debug: Log first review to see available date fields
        if (allReviews.length > 0) {
          console.log('🔍 Debug - First review data:', {
            id: allReviews[0].id,
            published_at: allReviews[0].published_at,
            create_time: allReviews[0].create_time,
            inserted_at: allReviews[0].inserted_at,
            raw: allReviews[0].raw,
            raw_createTime: allReviews[0].raw?.createTime,
            formattedDate: formatReviewDate(allReviews[0])
          });
          
          // Log les 3 premiers avis pour voir les dates
          allReviews.slice(0, 3).forEach((review, idx) => {
            console.log(`📅 Review ${idx} date fields:`, {
              published_at: review.published_at,
              create_time: review.create_time,
              raw_createTime: review.raw?.createTime,
              formatted: formatReviewDate(review)
            });
          });
        }
        
        // Map ALL reviews to table format
        const mappedRows: ReviewsTableRow[] = allReviews.map((review, index) => {
          // Utiliser formatReviewDate qui vérifie tous les champs possibles
          const reviewDate = formatReviewDate(review);
          
          // Log pour debug si pas de date trouvée
          if (!reviewDate && index < 3) {
            console.warn(`⚠️ No date found for review ${index}:`, {
              id: review.id,
              published_at: review.published_at,
              create_time: review.create_time,
              raw_createTime: review.raw?.createTime
            });
          }
          
          return {
          authorName: getDisplayAuthor(review),
          rating: review.rating || 0,
          comment: extractOriginalText(review.text) || "",
          platform: review.source || t("platforms.google"),
            reviewDate: reviewDate || '-' // Afficher '-' seulement si vraiment aucune date n'est trouvée
          };
        });
        
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
        comment: extractOriginalText(review.text) || "",
        platform: review.source || "Google",
        reviewDate: formatReviewDate(review)
      }));
      
      setReviewsList(mappedRows);
    } catch (error) {
      console.error("Error reloading data:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingReviews(false);
    }
  };

  // ⚠️ PROTECTION DES DONNÉES ⚠️
  // Function to handle delete all reviews
  // Cette fonction demande une DOUBLE confirmation avant suppression
  const handleDeleteAllReviews = async () => {
    if (!effectiveId) return;
    
    // ⚠️ PROTECTION 3: Double confirmation
    const firstConfirm = window.confirm(
      `⚠️ ATTENTION - ACTION IRRÉVERSIBLE ⚠️\n\n` +
      `Vous êtes sur le point de supprimer TOUS les avis pour cet établissement.\n\n` +
      `Cette action est irréversible et tous les avis seront perdus.\n\n` +
      `Un backup automatique sera créé, mais il est recommandé de faire un export manuel avant.\n\n` +
      `Êtes-vous ABSOLUMENT sûr de vouloir continuer ?`
    );
    
    if (!firstConfirm) {
      console.log('[PROTECTION DONNÉES] ✅ Suppression annulée par l\'utilisateur (première confirmation)');
      setShowDeleteDialog(false);
      return;
    }
    
    // Deuxième confirmation
    const secondConfirm = window.confirm(
      `🚨 DERNIÈRE CONFIRMATION 🚨\n\n` +
      `Cette action va supprimer DÉFINITIVEMENT tous les avis.\n\n` +
      `Il est encore temps d'annuler.\n\n` +
      `Confirmez-vous une dernière fois la suppression ?`
    );
    
    if (!secondConfirm) {
      console.log('[PROTECTION DONNÉES] ✅ Suppression annulée par l\'utilisateur (seconde confirmation)');
      setShowDeleteDialog(false);
      return;
    }
    
    try {
      setIsDeleting(true);
      console.warn('[PROTECTION DONNÉES] ⚠️ Suppression confirmée - début de la suppression...');
      
      await deleteAllReviews(effectiveId);
      
      // Toast rouge en bas à droite (même système que import CSV/JSON)
      sonnerToast.error(t("dashboard.allReviewsDeleted"), {
        duration: 5000,
      });
      
      // Reload the data to update UI
      await reloadData();
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('Error deleting reviews:', error);
      
      // Toast d'erreur rouge en bas à droite
      sonnerToast.error(t("dashboard.errorDeletingReviews"), {
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

  // Réinitialiser displayCount quand le filtre change
  useEffect(() => {
    setDisplayCount(10);
  }, [activeFilter]);

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

  if (!effectiveId && !displayName) {
    return <Card className="relative z-20 max-w-7xl mx-auto" data-testid="reviews-visual-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t("dashboard.reviewsOverview")}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="btn-close-reviews-visual">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {fallbackName || t("dashboard.noEstablishment")}
          </p>
        </CardContent>
      </Card>;
  }
  const starsData = summary ? [{
    stars: t("dashboard.stars5"),
    count: summary.byStars[5]
  }, {
    stars: t("dashboard.stars4"),
    count: summary.byStars[4]
  }, {
    stars: t("dashboard.stars3"),
    count: summary.byStars[3]
  }, {
    stars: t("dashboard.stars2"),
    count: summary.byStars[2]
  }, {
    stars: t("dashboard.stars1"),
    count: summary.byStars[1]
  }] : [];
  return <Card className="relative z-20 max-w-7xl mx-auto" data-testid="reviews-visual-panel">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" aria-hidden="true" />
              <h3 className="text-xl font-semibold" data-testid="establishment-title">
                {displayName ? `${t("dashboard.reviewsOverview")} - ${displayName}` : t("dashboard.reviewsOverview")}
              </h3>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              <span data-testid="establishment-subtitle">{t("establishment.title")}</span>
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
            <h3 className="text-lg font-medium mb-2">{displayName ? `${displayName}, ${t("dashboard.reviewsCount", { count: 0 })}` : t("dashboard.reviewsCount", { count: 0 })}</h3>
            <p className="text-muted-foreground">
              {t("dashboard.noReviewsForEstablishment")}
            </p>
          </div> : <>
            {/* Header Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="flex items-center p-4" data-testid="metric-avg-rating">
                  <Star className="w-8 h-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("dashboard.averageRating")}</p>
                    <p className="text-2xl font-bold">{summary.avgRating.toFixed(1)}/5</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center justify-between p-4" data-testid="metric-total-reviews">
                  <div className="flex items-center">
                    <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("dashboard.totalReviews")}</p>
                      <p className="text-2xl font-bold">{summary.total}</p>
                    </div>
                  </div>
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
                    <CardContent className="flex items-center px-4 py-2">
                      <List className="w-8 h-8 text-primary mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("dashboard.allReviews")}</p>
                        <p className="text-2xl font-bold">{totalCount}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Avis positifs */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'positive' ? 'ring-2 ring-green-500 bg-green-500/5' : ''}`}
                    onClick={() => setActiveFilter('positive')}
                  >
                    <CardContent className="flex items-center px-4 py-2">
                      <ThumbsUp className="w-8 h-8 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("dashboard.positiveReviews")}</p>
                        <p className="text-2xl font-bold">{positiveCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Avis négatifs */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'negative' ? 'ring-2 ring-red-500 bg-red-500/5' : ''}`}
                    onClick={() => setActiveFilter('negative')}
                  >
                    <CardContent className="flex items-center px-4 py-2">
                      <ThumbsDown className="w-8 h-8 text-red-500 mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("dashboard.negativeReviews")}</p>
                        <p className="text-2xl font-bold">{negativeCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Suspicion faux avis */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'suspect' ? 'ring-2 ring-orange-500 bg-orange-500/5' : ''}`}
                    onClick={() => setActiveFilter('suspect')}
                  >
                    <CardContent className="flex items-center px-4 py-2">
                      <ShieldAlert className="w-8 h-8 text-orange-500 mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("dashboard.suspectReviewsTitle")}</p>
                        <p className="text-2xl font-bold">{suspectCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Stars Distribution */}
            

            {/* Reviews List with Filter */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="text-sm">
                  {t("dashboard.filter")} : {activeFilter === 'all' ? t("dashboard.allReviews") :
                           activeFilter === 'positive' ? t("dashboard.positiveReviewsFilter") : 
                           activeFilter === 'negative' ? t("dashboard.negativeReviewsFilter") : 
                           t("dashboard.suspectReviews")}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'hsl(var(--primary))',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                    onClick={() => setShowRatingDistributionModal(true)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'hsl(var(--primary) / 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'hsl(var(--primary))';
                    }}
                  >
                    <PieChart 
                      className="w-4 h-4 mr-2" 
                      style={{
                        color: 'hsl(var(--primary))',
                        display: 'block',
                      }}
                    />
                    <span style={{ color: 'hsl(var(--primary))' }}>{t("dashboard.platformDistribution")}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'hsl(var(--primary))',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                    onClick={() => setShowTrendModal(true)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'hsl(var(--primary) / 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'hsl(var(--primary))';
                    }}
                  >
                    <LineChart 
                      className="w-4 h-4 mr-2" 
                      style={{
                        color: 'hsl(var(--primary))',
                        display: 'block',
                      }}
                    />
                    <span style={{ color: 'hsl(var(--primary))' }}>{t("dashboard.ratingEvolution")}</span>
                  </Button>
                </div>
              </div>
              {(() => {
                // Calculer les avis filtrés
                const filteredReviews = (() => {
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
                })();

                // Limiter l'affichage
                const reviewsToDisplay = filteredReviews.slice(0, displayCount);

                return (
                  <>
                    <ReviewsTable
                      rows={reviewsToDisplay}
                      isLoading={isLoadingReviews}
                      emptyLabel={activeFilter === 'all' ? t("dashboard.noReviewsYet") : t("dashboard.noReviewsYet")}
                      data-testid="establishment-reviews-table"
                    />

                    {/* Bouton "Afficher plus" */}
                    {filteredReviews.length > displayCount && (
                      <div className="flex justify-center py-4">
                        <button 
                          onClick={() => setDisplayCount(prev => prev + 10)}
                          className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Afficher plus
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Action destructive: supprimer tous les avis (bas droite) */}
              <div className="flex justify-end mt-4">
                {summary.total > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    data-testid="btn-delete-all-reviews"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                    title={t("dashboard.deleteAllReviews")}
                  >
                    <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
            </div>
          </>}
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("modals.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("modals.confirmDeleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllReviews}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <TrendModal
          open={showTrendModal}
          onOpenChange={setShowTrendModal}
          establishmentId={effectiveId || ""}
          establishmentName={displayName || undefined}
        />
        <RatingDistributionModal
          open={showRatingDistributionModal}
          onOpenChange={setShowRatingDistributionModal}
          establishmentId={effectiveId || ""}
          establishmentName={displayName || undefined}
        />
    </Card>;
}