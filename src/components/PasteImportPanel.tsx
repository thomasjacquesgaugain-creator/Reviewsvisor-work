import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { parsePastedReviews, ParsedReview } from "@/utils/parsePastedReviews";
import { Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { bulkCreateReviews, ReviewCreate } from "@/services/reviewsService";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { ReviewsTable, ReviewsTableRow } from "@/components/reviews/ReviewsTable";
import { getDisplayAuthor } from "@/utils/getDisplayAuthor";

interface PasteImportPanelProps {
  onImportBulk?: (reviews: any[]) => void;
  onClose?: () => void;
  onImportSuccess?: () => void; // Callback to refresh reviews data
  onOpenVisualPanel?: () => void; // Callback to open visual panel
}

export default function PasteImportPanel({ onImportBulk, onClose, onImportSuccess, onOpenVisualPanel }: PasteImportPanelProps) {
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
        title: "Erreur",
        description: "Impossible d'identifier l'établissement courant.",
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
      
      // TOAST bas-droite avec rapport détaillé
      const duplicates = reasons?.duplicate || 0;
      sonnerToast.success(`✅ ${inserted} avis enregistrés pour ${est.name} (doublons: ${duplicates})`, {
        duration: 5000,
        action: {
          label: "Détails",
          onClick: () => {
            console.log("Rapport d'import:", { inserted, skipped, reasons, sampleSkipped });
            if (sampleSkipped && sampleSkipped.length > 0) {
              console.table(sampleSkipped);
            }
          }
        }
      });

      // Log détaillé pour debug
      console.log("Import terminé:", { inserted, skipped, reasons });
      if (sampleSkipped && sampleSkipped.length > 0) {
        console.table(sampleSkipped);
      }

      // RESET UI
      setParsedReviews([]);
      setPastedText("");
      setShowPreview(false);
      
      // OUVRIR le panneau + SCROLL
      if (onOpenVisualPanel) {
        onOpenVisualPanel();
        setTimeout(() => {
          document.getElementById("reviews-visual-anchor")?.scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
          });
        }, 100);
      }
      
      // SIGNAL de refresh pour le panneau
      window.dispatchEvent(new CustomEvent("reviews:imported", { 
        detail: { establishmentId: est.id || est.place_id } 
      }));
      
      // Refresh reviews data (legacy callback)
      if (onImportSuccess) {
        onImportSuccess();
      }
      
      // Option : fermer la barre
      if (onClose) {
        onClose();
      }
    } catch (e) {
      toast({
        title: "Erreur d'import",
        description: (
          <span data-testid="toast-import-error">Échec de l'import des avis.</span>
        ),
        variant: "destructive",
      });
      console.error(e);
    } finally {
      setIsImporting(false);
    }
  }, [currentEstablishment, parsedReviews, onClose, onImportSuccess, onOpenVisualPanel]);

  // Calculate valid reviews count based on rating criteria
  const validReviews = useMemo(() => {
    const source = parsedReviews?.length ? parsedReviews : parsePastedReviews(pastedText || "");
    return (source || []).filter(r => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5);
  }, [parsedReviews, pastedText]);

  const canImport = !isImporting && validReviews.length > 0;

  // Convert parsed reviews to table format
  const reviewsTableData: ReviewsTableRow[] = useMemo(() => {
    return parsedReviews.map(review => {
      // Construire un objet avec tous les champs possibles pour getDisplayAuthor
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

  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div data-testid="paste-import-panel" className="space-y-6 relative z-40 pointer-events-auto">
      {/* Instructions - Collapsible block */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-foreground">Instructions</span>
          </div>
          <div className="transition-transform duration-200" style={{ transform: showInstructions ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
        <div
          className="overflow-hidden transition-all duration-200 ease-out"
          style={{
            maxHeight: showInstructions ? '200px' : '0px',
            opacity: showInstructions ? 1 : 0,
          }}
        >
          <div className="px-4 py-3 text-sm text-muted-foreground border-t border-border">
            {/* Contenu vide pour le moment */}
          </div>
        </div>
      </div>

      {/* Paste area */}
      <div data-testid="paste-input-wrap" className="relative z-10">
        <div className="space-y-2">
          <Textarea
            data-testid="paste-input"
            placeholder="Collez ici les avis copiés depuis Google Maps ou Tripadvisor..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="min-h-[200px] resize-none"
            aria-describedby="paste-help"
          />
          <p id="paste-help" className="text-xs text-muted-foreground">
            Collez plusieurs avis en une fois. Le système détectera automatiquement les notes, auteurs et commentaires.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div data-testid="paste-actions" className="relative z-50 pointer-events-auto bg-background">
        <div className="flex gap-3">
          <Button
            data-testid="btn-paste-preview"
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={!pastedText.trim()}
          >
            Aperçu
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
                Import en cours...
              </>
            ) : (
              `Importer (${validReviews.length} avis)`
            )}
          </Button>
        </div>
      </div>

      {/* Preview table */}
      {showPreview && parsedReviews.length > 0 && (
        <section data-testid="paste-preview-wrap" className="relative z-0">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-4">
                Aperçu des avis détectés ({parsedReviews.length} total, {validReviews.length} valides)
              </h4>
              
              <ReviewsTable
                rows={reviewsTableData}
                isLoading={false}
                emptyLabel="Aucun avis détecté"
                data-testid="paste-preview-table"
              />
              
              {parsedReviews.some(r => !r.isValid) && (
                <p className="text-xs text-destructive mt-2">
                  Les lignes en rouge sont incomplètes et ne seront pas importées.
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
                Aucun avis détecté dans le texte collé. Vérifiez le format ou essayez de coller un autre contenu.
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}