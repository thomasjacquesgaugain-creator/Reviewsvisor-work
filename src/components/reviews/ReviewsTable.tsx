import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { extractOriginalText } from "@/utils/extractOriginalText";
import { useTranslation } from "react-i18next";

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
  emptyLabel,
  "data-testid": dataTestId = "reviews-table"
}: ReviewsTableProps) {
  const { t } = useTranslation();
  const defaultEmptyLabel = emptyLabel || t("dashboard.noReviewsYet");
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
        {defaultEmptyLabel}
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
              {t("subscription.author")}
            </th>
            <th 
              scope="col" 
              className="border border-border px-3 py-2 text-left text-sm font-medium"
              data-testid="col-rating"
            >
              {t("dashboard.rating")}
            </th>
            <th 
              scope="col" 
              className="border border-border px-3 py-2 text-left text-sm font-medium"
              data-testid="col-comment"
            >
              {t("import.comment")}
            </th>
            <th 
              scope="col" 
              className="border border-border px-3 py-2 text-left text-sm font-medium"
              data-testid="col-platform"
            >
              {t("subscription.source")}
            </th>
            <th 
              scope="col" 
              className="border border-border px-3 py-2 text-left text-sm font-medium"
              data-testid="col-date"
            >
              {t("dashboard.date")}
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
                <div className="truncate" title={extractOriginalText(review.comment) || t("dashboard.noComment")}>
                  {review.comment ? (
                    extractOriginalText(review.comment)
                  ) : (
                    <span className="text-muted-foreground italic">{t("dashboard.noComment")}</span>
                  )}
                </div>
              </td>
              <td className="border border-border px-3 py-2">
                {(() => {
                  const p = (review.platform || "google").toString().toLowerCase();
                  const labels: Record<string, { bg: string; label: string }> = {
                    google: { bg: "#3b82f6", label: "Google" },
                    outscraper: { bg: "#3b82f6", label: "Google" },
                    tripadvisor: { bg: "#00af87", label: "TripAdvisor" },
                    trustpilot: { bg: "#00b67a", label: "Trustpilot" },
                  };
                  const config = labels[p] || { bg: "hsl(var(--muted))", label: review.platform || "—" };
                  return (
                    <span
                      style={{
                        backgroundColor: config.bg,
                        color: "#ffffff",
                        padding: "2px 10px",
                        borderRadius: "9999px",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {config.label}
                    </span>
                  );
                })()}
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