import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { extractOriginalText } from "@/utils/extractOriginalText";

export interface ReviewsTableRow {
  authorName: string;
  rating: number;
  comment: string;
  platform: string;
  reviewDate?: string | null;
}

export interface ReviewsTableProps {
  rows: ReviewsTableRow[];
  isLoading?: boolean;
  emptyLabel?: string;
  "data-testid"?: string;
}

const renderStars = (rating: number) => {
  return (
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
};

export function ReviewsTable({
  rows,
  isLoading = false,
  emptyLabel = "Aucun avis",
  "data-testid": dataTestId = "reviews-table"
}: ReviewsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table 
        data-testid={dataTestId}
        className="w-full border-collapse border border-border"
      >
        <thead>
          <tr className="bg-muted/50">
            <th 
              scope="col" 
              className="border border-border px-3 py-2 text-left text-sm font-medium"
              data-testid="col-author"
            >
              Auteur
            </th>
            <th 
              scope="col" 
              className="border border-border px-3 py-2 text-left text-sm font-medium"
              data-testid="col-rating"
            >
              Note
            </th>
            <th 
              scope="col" 
              className="border border-border px-3 py-2 text-left text-sm font-medium"
              data-testid="col-comment"
            >
              Commentaire
            </th>
            <th 
              scope="col" 
              className="border border-border px-3 py-2 text-left text-sm font-medium"
              data-testid="col-platform"
            >
              Source
            </th>
            <th 
              scope="col" 
              className="border border-border px-3 py-2 text-left text-sm font-medium"
              data-testid="col-date"
            >
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((review, index) => (
            <tr key={index} data-testid="review-row">
              <td className="border border-border px-3 py-2 text-sm">
                {review.authorName}
              </td>
              <td className="border border-border px-3 py-2">
                {renderStars(review.rating)}
              </td>
              <td className="border border-border px-3 py-2 text-sm max-w-md">
                <div className="truncate" title={extractOriginalText(review.comment) || "Pas de commentaire"}>
                  {review.comment ? (
                    extractOriginalText(review.comment)
                  ) : (
                    <span className="text-muted-foreground italic">Pas de commentaire</span>
                  )}
                </div>
              </td>
              <td className="border border-border px-3 py-2">
                <Badge variant={review.platform === 'unknown' ? 'secondary' : 'default'}>
                  {review.platform}
                </Badge>
              </td>
              <td className="border border-border px-3 py-2 text-sm text-muted-foreground">
                {review.reviewDate || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}