import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { listAll } from "@/services/reviewsService";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

interface RatingDistributionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  establishmentName?: string;
}

interface RatingDistribution {
  avgRating: number;
  total: number;
  byStars: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export function RatingDistributionModal({
  open,
  onOpenChange,
  establishmentId,
  establishmentName,
}: RatingDistributionModalProps) {
  const [distribution, setDistribution] = useState<RatingDistribution | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!open || !establishmentId) {
      return;
    }

    const loadDistribution = async () => {
      setIsLoading(true);

      try {
        const allReviews = await listAll(establishmentId);

        if (!allReviews || allReviews.length === 0) {
          setDistribution({
            avgRating: 0,
            total: 0,
            byStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          });
          return;
        }

        // Calculer la distribution
        const byStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0;
        let totalCount = 0;

        allReviews.forEach((review) => {
          if (review.rating && review.rating >= 1 && review.rating <= 5) {
            const rating = Math.floor(review.rating);
            byStars[rating as keyof typeof byStars]++;
            totalRating += review.rating;
            totalCount++;
          }
        });

        const avgRating = totalCount > 0 ? totalRating / totalCount : 0;

        setDistribution({
          avgRating,
          total: totalCount,
          byStars
        });
      } catch (error) {
        console.error("Error loading rating distribution:", error);
        setDistribution({
          avgRating: 0,
          total: 0,
          byStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDistribution();
  }, [open, establishmentId]);

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Répartition des notes</DialogTitle>
          <DialogDescription>
            {establishmentName
              ? `Distribution des notes pour ${establishmentName}`
              : "Distribution des notes sur 5 étoiles"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="h-64">
            <Skeleton className="h-full w-full" />
          </div>
        ) : distribution && distribution.total > 0 ? (
          <div className="grid grid-cols-2 gap-8 py-4">
            {/* Note moyenne à gauche */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {distribution.avgRating.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mb-1">Note moyenne</div>
              <div className="text-lg font-semibold text-muted-foreground">
                {distribution.avgRating.toFixed(2)}/5
              </div>
            </div>

            {/* Distribution à droite */}
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = distribution.byStars[rating as keyof typeof distribution.byStars];
                const percentage = distribution.total > 0 
                  ? ((count / distribution.total) * 100).toFixed(2).replace('.', ',')
                  : "0,00";
                const percentageNum = parseFloat(percentage.replace(',', '.'));

                return (
                  <div key={rating} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {renderStarRating(rating)}
                        <span className="font-medium">{count}</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-muted-foreground">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-[#F59E0B] h-2.5 rounded-full transition-all"
                        style={{ width: `${percentageNum}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              Aucune donnée disponible.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

