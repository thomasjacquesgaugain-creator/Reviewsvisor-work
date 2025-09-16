import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getReviewsList } from "@/services/reviewsService";

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  source: string;
  published_at: string | null;
  inserted_at: string;
}

interface ReviewsFeedProps {
  establishmentId: string;
}

export function ReviewsFeed({ establishmentId }: ReviewsFeedProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  const loadReviews = async (cursor?: string, append = false) => {
    try {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);

      const { items, nextCursor: newCursor } = await getReviewsList(establishmentId, { 
        limit: 50, 
        cursor 
      });

      if (append) {
        setReviews(prev => [...prev, ...items]);
      } else {
        setReviews(items);
      }
      
      setNextCursor(newCursor);
      setHasMore(!!newCursor);
    } catch (error) {
      console.error("Error loading reviews:", error);
      if (!append) setReviews([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (establishmentId) {
      loadReviews();
    }
  }, [establishmentId]);

  // Listen for reviews imported event to refresh
  useEffect(() => {
    const handleReviewsImported = (e: CustomEvent) => {
      const estId = e.detail?.establishmentId;
      if (estId === establishmentId) {
        loadReviews(); // Reload from start
      }
    };

    window.addEventListener('reviews:imported', handleReviewsImported as EventListener);
    return () => window.removeEventListener('reviews:imported', handleReviewsImported as EventListener);
  }, [establishmentId]);

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      loadReviews(nextCursor, true);
    }
  };

  const getAuthorInitials = (author: string) => {
    if (!author || author === "Anonyme") return "A";
    const parts = author.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return author[0]?.toUpperCase() || "A";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const renderStars = (rating: number) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="reviews-feed">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8" data-testid="reviews-feed">
        <h3 className="text-lg font-medium mb-2">Aucun avis enregistré</h3>
        <p className="text-muted-foreground">
          Aucun avis n'a été enregistré pour cet établissement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="reviews-feed">
      {reviews.map((review) => (
        <Card key={review.id} data-testid="review-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="text-sm font-medium">
                  {getAuthorInitials(review.author)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-medium" 
                      data-testid="review-author"
                    >
                      {review.author || "Anonyme"}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      data-testid="review-platform"
                    >
                      {review.source}
                    </Badge>
                  </div>
                  <span 
                    className="text-sm text-muted-foreground"
                    data-testid="review-date"
                  >
                    {formatDate(review.published_at || review.inserted_at)}
                  </span>
                </div>
                
                <div 
                  className="flex items-center gap-2"
                  data-testid="review-rating"
                >
                  {renderStars(review.rating)}
                  <span className="text-sm text-muted-foreground">
                    {review.rating}/5
                  </span>
                </div>
                
                <div 
                  className="text-sm leading-relaxed"
                  data-testid="review-comment"
                >
                  {review.text ? (
                    <p>{review.text}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Pas de commentaire</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            data-testid="reviews-load-more"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Chargement...
              </>
            ) : (
              "Charger plus"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}