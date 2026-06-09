import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  MessageSquare,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ParetoItem, Review, ThemeAnalysis } from "@/types/analysis";
import { useEffect, useState } from "react";

interface StrengthInsightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strengths: ParetoItem[];
  initialIndex?: number;
  reviews?: Review[];
  themes?: ThemeAnalysis[];
}

function getReviewText(review: Review): string {
  return review?.texte || (review as any)?.comment || (review as any)?.text || "";
}

function getReviewRating(review: Review): number | undefined {
  return review?.note ?? (review as any)?.rating;
}

function isPositiveReview(review: Review): boolean {
  const rating = getReviewRating(review);
  const sentiment =
    review?.sentimentLabel ||
    (review as any)?.sentiment ||
    (review as any)?.sentiment_label;

  return rating >= 4 || sentiment === "positive";
}

function getThemeName(theme: ThemeAnalysis): string {
  return (theme as any)?.name || theme?.theme || (theme as any)?.key || "";
}

export function StrengthInsightModal({
  open,
  onOpenChange,
  strengths,
  initialIndex = 0,
  reviews = [],
  themes = [],
}: StrengthInsightModalProps) {
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(initialIndex);

  useEffect(() => {
    if (open) {
      setCurrentStep(initialIndex);
    }
  }, [open, initialIndex]);

  const strength = strengths[currentStep];

  if (!strength) return null;

  const total = strengths.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === total - 1;

  const positiveReviews = reviews
    .filter((review) => {
      const reviewText = getReviewText(review);

      return reviewText.trim().length > 0 && isPositiveReview(review);
    })
    .slice(0, 5);

  const relatedThemes = themes
    .filter((theme) => {
      const themeName = getThemeName(theme);

      return themeName.toLowerCase() === strength.name.toLowerCase();
    })
    .slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t("analysis.pareto.strengthDetails.title", {
                name: strength.name,
                defaultValue: strength.name,
              })}
            </DialogTitle>

            <span className="text-sm text-slate-400 whitespace-nowrap">
              {currentStep + 1} / {total}
            </span>
          </div>

          {total > 1 && (
            <div className="flex items-center gap-2 mt-3">
              {strengths.map((item, idx) => (
                <button
                  key={item.key ?? idx}
                  onClick={() => setCurrentStep(idx)}
                  title={item.name}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    idx === currentStep
                      ? "w-6 bg-green-500"
                      : "w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">

          {/* SUMMARY */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/30 dark:border-green-900/50">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />

              <div>
                <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  {t("analysis.pareto.strengthDetails.summary", "Summary")}
                </h3>

                <p className="text-slate-700 dark:text-slate-300">
                  {t("analysis.pareto.strengthDetails.summaryText", {
                    name: strength.name,
                    count: strength.count,
                    defaultValue: `${strength.name} has been mentioned ${strength.count} times in positive customer feedback and is one of the strongest satisfaction drivers.`,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t("analysis.pareto.strengthDetails.mentions", "Mentions")}
                </span>
              </div>

              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {strength.count} 
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t("analysis.pareto.strengthDetails.share", "Share")}
                </span>
              </div>

              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {typeof strength.percentage === "number"
                  ? `${strength.percentage.toFixed(1)}%`
                  : "-"}
              </p>
            </div>
          </div>

          {/* RELATED THEMES */}
          {relatedThemes.length > 0 && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">
                {t("analysis.pareto.strengthDetails.relatedThemes", "Related Themes")}
              </h3>

              <div className="flex flex-wrap gap-2">
                {relatedThemes.map((theme, index) => (
                  <Badge key={index} variant="outline">
                    {getThemeName(theme)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOMER QUOTES */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4" />

              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {t("analysis.pareto.strengthDetails.customerReviews", "Customer Reviews")}
              </h3>
            </div>

            {positiveReviews.length > 0 ? (
              <div className="space-y-3">
                {positiveReviews.map((review, index) => {
                  const reviewText = getReviewText(review);
                  const rating = getReviewRating(review);

                  return (
                    <div
                      key={index}
                      className="border-l-4 border-green-500 pl-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-r"
                    >
                      <p className="text-sm italic text-slate-700 dark:text-slate-300">
                        "
                        {reviewText.length > 250
                          ? `${reviewText.substring(0, 250)}...`
                          : reviewText}
                        "
                      </p>

                      {rating && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {t("analysis.pareto.rating", "Rating")}: {rating}/5
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">
                {t("analysis.pareto.strengthDetails.noCustomerComments", "No customer comments available.")}
              </p>
            )}
          </div>

          {/* RECOMMENDATION */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong>
                {t("analysis.pareto.recommendation", "Recommendation")}:
              </strong>{" "}
              {t(
                "analysis.pareto.strengthDetails.recommendationText",
                "Maintain this strength, promote it in your communication, and continue monitoring customer feedback to preserve this advantage."
              )}
            </p>
          </div>

          {/* PAGINATION */}
          {total > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                size="sm"
                disabled={isFirst}
                onClick={() => setCurrentStep((s) => s - 1)}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("common.previous") || "Previous"}
              </Button>

              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                {!isFirst && (
                  <span className="truncate max-w-[120px]">
                    {strengths[currentStep - 1]?.name}
                  </span>
                )}

                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">
                  {strength.name}
                </span>

                {!isLast && (
                  <span className="truncate max-w-[120px]">
                    {strengths[currentStep + 1]?.name}
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={isLast}
                onClick={() => setCurrentStep((s) => s + 1)}
                className="gap-1"
              >
                {t("common.next") || "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}