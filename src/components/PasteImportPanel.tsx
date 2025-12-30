import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { parsePastedReviews, ParsedReview } from "@/utils/parsePastedReviews";
import { Loader2 } from "lucide-react";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { bulkCreateReviews, ReviewCreate } from "@/services/reviewsService";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { ReviewsTable, ReviewsTableRow } from "@/components/reviews/ReviewsTable";
import { getDisplayAuthor } from "@/utils/getDisplayAuthor";
import CollapsibleInstructionsHeader from "./CollapsibleInstructionsHeader";

interface PasteImportPanelProps {
  onImportBulk?: (reviews: any[]) => void;
  onClose?: () => void;
  onImportSuccess?: () => void;
  onOpenVisualPanel?: () => void;
}

export default function PasteImportPanel({ onImportBulk, onClose, onImportSuccess, onOpenVisualPanel }: PasteImportPanelProps) {
  const { t } = useTranslation();
  const [pastedText, setPastedText] = useState("");
  const [parsedReviews, setParsedReviews] = useState<ParsedReview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const currentEstablishment = useCurrentEstablishment();
  const { toast } = useToast();

  const handlePreview = () => {
    if (!pastedText.trim()) return;
    
    const reviews = parsePastedReviews(pastedText);
    setParsedReviews(reviews);
    setShowPreview(true);
  };

  const handlePasteImport = useCallback(async (valid?: ParsedReview[]) => {
    const est = currentEstablishment;
    const list = valid && valid.length ? valid : (parsedReviews || []).filter(r => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5);

    if (!est) {
      toast({
        title: t("common.error"),
        description: t("pasteImport.noEstablishment"),
        variant: "destructive",
      });
      return;
    }
    if (!list.length) return;

    const payload: ReviewCreate[] = list.map(v => ({
      establishment_id: est.id || est.place_id,
      establishment_place_id: est.place_id,
      establishment_name: est.name,
      source: v.platform || "pasted",
      author_first_name: v.firstName || "",
      author_last_name: v.lastName || "",
      rating: v.rating,
      comment: v.comment || "",
      review_date: v.reviewDate || null,
      import_method: "paste",
      import_source_url: (v as any).sourceUrl || null,
      raw_fingerprint: v.rawFingerprint || undefined,
    }));

    setIsImporting(true);
    try {
      const { inserted, skipped, reasons, sampleSkipped } = await bulkCreateReviews(payload);
      
      const duplicates = reasons?.duplicate || 0;
      sonnerToast.success(t("establishment.reviewsAnalyzedSuccess", { count: inserted }) + ` (${t("dashboard.duplicates") || 'duplicates'}: ${duplicates})`, {
        duration: 5000,
        action: {
          label: t("common.details"),
          onClick: () => {
            console.log("Import report:", { inserted, skipped, reasons, sampleSkipped });
            if (sampleSkipped && sampleSkipped.length > 0) {
              console.table(sampleSkipped);
            }
          }
        }
      });

      setParsedReviews([]);
      setPastedText("");
      setShowPreview(false);
      
      if (onOpenVisualPanel) {
        onOpenVisualPanel();
        setTimeout(() => {
          document.getElementById("reviews-visual-anchor")?.scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
          });
        }, 100);
      }
      
      window.dispatchEvent(new CustomEvent("reviews:imported", { 
        detail: { establishmentId: est.id || est.place_id } 
      }));
      
      if (onImportSuccess) {
        onImportSuccess();
      }
      
      if (onClose) {
        onClose();
      }
    } catch (e) {
      toast({
        title: t("pasteImport.importError"),
        description: (
          <span data-testid="toast-import-error">{t("pasteImport.importFailed")}</span>
        ),
        variant: "destructive",
      });
      console.error(e);
    } finally {
      setIsImporting(false);
    }
  }, [currentEstablishment, parsedReviews, onClose, onImportSuccess, onOpenVisualPanel, t, toast]);

  const validReviews = useMemo(() => {
    const source = parsedReviews?.length ? parsedReviews : parsePastedReviews(pastedText || "");
    return (source || []).filter(r => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5);
  }, [parsedReviews, pastedText]);

  const canImport = !isImporting && validReviews.length > 0;

  const reviewsTableData: ReviewsTableRow[] = useMemo(() => {
    return parsedReviews.map(review => {
      const reviewWithAllFields = {
        ...review,
        author_name: `${review.firstName} ${review.lastName}`.trim(),
        author: `${review.firstName} ${review.lastName}`.trim(),
        name: `${review.firstName} ${review.lastName}`.trim(),
      };
      
      return {
        authorName: getDisplayAuthor(reviewWithAllFields),
        rating: review.rating,
        comment: review.comment || "",
        platform: review.platform || "unknown",
        reviewDate: review.reviewDate || null
      };
    });
  }, [parsedReviews]);

  return (
    <div data-testid="paste-import-panel" className="space-y-6 relative z-40 pointer-events-auto">
      <CollapsibleInstructionsHeader>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside pl-1">
          <li>
            {t("pasteImport.instructions.step1")}{" "}
            <a 
              href="https://takeout.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Google Takeout
            </a>.
          </li>
          <li>{t("pasteImport.instructions.step2")}</li>
          <li>{t("pasteImport.instructions.step3")}</li>
          <li>{t("pasteImport.instructions.step4")}</li>
          <li>{t("pasteImport.instructions.step5")}</li>
          <li>{t("pasteImport.instructions.step6")}</li>
          <li>{t("pasteImport.instructions.step7")}</li>
          <li>{t("pasteImport.instructions.step8")}</li>
        </ul>
      </CollapsibleInstructionsHeader>

      <div data-testid="paste-input-wrap" className="relative z-10">
        <div className="space-y-2">
          <Textarea
            data-testid="paste-input"
            placeholder={t("pasteImport.placeholder")}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="min-h-[200px] resize-none"
            aria-describedby="paste-help"
          />
          <p id="paste-help" className="text-xs text-muted-foreground">
            {t("pasteImport.helpText")}
          </p>
        </div>
      </div>

      <div data-testid="paste-actions" className="relative z-50 pointer-events-auto bg-background">
        <div className="flex gap-3">
          <Button
            data-testid="btn-paste-preview"
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={!pastedText.trim()}
          >
            {t("pasteImport.preview")}
          </Button>
          
          <Button
            data-testid="btn-paste-import"
            type="button"
            className="relative z-50"
            disabled={!canImport}
            onClick={() => handlePasteImport(validReviews)}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("pasteImport.importInProgress")}
              </>
            ) : (
              t("pasteImport.importButton", { count: validReviews.length })
            )}
          </Button>
        </div>
      </div>

      {showPreview && parsedReviews.length > 0 && (
        <section data-testid="paste-preview-wrap" className="relative z-0">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-4">
                {t("pasteImport.previewTitle", { total: parsedReviews.length, valid: validReviews.length })}
              </h4>
              
              <ReviewsTable
                rows={reviewsTableData}
                isLoading={false}
                emptyLabel={t("pasteImport.noReviewsDetected")}
                data-testid="paste-preview-table"
              />
              
              {parsedReviews.some(r => !r.isValid) && (
                <p className="text-xs text-destructive mt-2">
                  {t("pasteImport.incompleteRows")}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {showPreview && parsedReviews.length === 0 && (
        <section data-testid="paste-preview-wrap" className="relative z-0">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {t("pasteImport.noReviewsInText")}
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}