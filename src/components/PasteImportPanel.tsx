import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { parsePastedReviews, ParsedReview } from "@/utils/parsePastedReviews";
import { Loader2 } from "lucide-react";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { ReviewsTable, ReviewsTableRow } from "@/components/reviews/ReviewsTable";
import { dedupeBatch } from "@/lib/reviews/dedupe";
import { supabase } from "@/integrations/supabase/client";

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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté.",
        variant: "destructive",
      });
      return;
    }

    // Préparer les données pour l'API avec déduplication
    const itemsForAPI = list.map(v => ({
      author: `${v.firstName} ${v.lastName}`.trim() || "Anonyme",
      rating: v.rating,
      comment: v.comment || "",
      platform: v.platform || "Google",
      review_date: v.reviewDate || null,
      user_id: user.id,
    }));

    // Déduplication en batch avant envoi
    const deduped = dedupeBatch(itemsForAPI);

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-import-reviews', {
        body: { 
          establishmentId: est.id || est.place_id,
          items: deduped,
          user_id: user.id
        }
      });

      if (error) {
        throw new Error(error.message || "Erreur lors de l'import");
      }

      const result = data;
      // Toast avec rapport détaillé
      sonnerToast.success(
        `✔ ${result.inserted} avis importés — ${result.duplicates} doublons ignorés — ${result.invalid} invalides`,
        {
          duration: 5000,
          action: {
            label: "Détails",
            onClick: () => {
              console.log("Rapport d'import:", result);
            }
          }
        }
      );

      // Log détaillé pour debug
      console.log("Import terminé:", result);

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
    } catch (e: any) {
      toast({
        title: "Erreur d'import",
        description: (
          <span data-testid="toast-import-error">
            Échec de l'import des avis: {e?.message || "Erreur inconnue"}
          </span>
        ),
        variant: "destructive",
      });
      console.error(e);
    } finally {
      setIsImporting(false);
    }
  }, [currentEstablishment, parsedReviews, onClose, onImportSuccess, onOpenVisualPanel, toast]);

  // Calculate valid reviews count based on rating criteria
  const validReviews = useMemo(() => {
    const source = parsedReviews?.length ? parsedReviews : parsePastedReviews(pastedText || "");
    return (source || []).filter(r => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5);
  }, [parsedReviews, pastedText]);

  const canImport = !isImporting && validReviews.length > 0;

  // Convert parsed reviews to table format
  const reviewsTableData: ReviewsTableRow[] = useMemo(() => {
    return parsedReviews.map(review => ({
      authorName: `${review.firstName} ${review.lastName}`.trim() || "Anonyme",
      rating: review.rating,
      comment: review.comment || "",
      platform: review.platform || "unknown",
      reviewDate: review.reviewDate || null
    }));
  }, [parsedReviews]);

  return (
    <div data-testid="paste-import-panel" className="space-y-6 relative z-40 pointer-events-auto">
      {/* Instructions */}
      <div className="text-sm text-muted-foreground">
        <p className="mb-2">
          <strong>Instructions :</strong> Dans Google Maps, ouvrez "Tous les avis", cliquez sur "Plus" dans chaque avis pour dérouler le texte complet, puis copiez/collez le contenu ici.
        </p>
        <p>
          Fonctionne aussi avec les avis Tripadvisor copiés depuis la page web.
        </p>
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