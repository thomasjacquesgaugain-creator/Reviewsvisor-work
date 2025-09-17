import { useState, useMemo, useCallback } from "react";
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

  const [importLabel, setImportLabel] = useState("");

  const CHUNK_SIZE = 200;
  const TIMEOUT_MS = 30000;

  async function bulkPOST(body: any) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch("/api/reviews/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Bulk failed ${res.status}: ${text}`);
      }
      return await res.json(); // { inserted, skipped, reasons? }
    } finally {
      clearTimeout(t);
    }
  }

  const handlePasteImport = useCallback(async (reviews: ParsedReview[]) => {
    try {
      setIsImporting(true);
      const est = currentEstablishment;
      const estId = est?.id || est?.place_id;
      if (!estId) throw new Error("Établissement introuvable.");

      // mapping : accepter commentaire vide; fallback fingerprint
      const toPayload = (r: ParsedReview) => ({
        establishmentId: estId,
        platform: r.platform ?? "Google",
        authorFirstName: r.firstName ?? null,
        authorLastName: r.lastName ?? null,
        rating: r.rating,
        comment: r.comment ?? "",
        reviewDate: r.reviewDate ?? null,
        import_method: "paste",
        raw_fingerprint: r.rawFingerprint ?? null,
      });

      const all = reviews
        .filter(r => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5)
        .map(toPayload);

      if (all.length === 0) throw new Error("Aucun avis valide à importer.");

      // en lots + progression
      let done = 0, inserted = 0, skipped = 0;
      for (let i = 0; i < all.length; i += CHUNK_SIZE) {
        const chunk = all.slice(i, i + CHUNK_SIZE);
        const { inserted: ins = 0, skipped: sk = 0 } = await bulkPOST({ reviews: chunk });
        inserted += ins; 
        skipped += sk; 
        done += chunk.length;
        setImportLabel(`Import… ${done}/${all.length}`);
      }

      sonnerToast.success(`✅ ${inserted} avis ajoutés • 🔁 doublons ignorés : ${skipped}`);

      // reset + ouverture panneau + refresh
      setParsedReviews([]); 
      setPastedText(""); 
      setImportLabel("");
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
        detail: { establishmentId: estId } 
      }));

      if (onImportSuccess) {
        onImportSuccess();
      }

      if (onClose) {
        onClose();
      }

    } catch (err: any) {
      console.error("Import error:", err);
      sonnerToast.error(`❌ Import impossible : ${err?.message ?? "erreur inconnue"}`);
    } finally {
      setIsImporting(false);
      setImportLabel("");
    }
  }, [currentEstablishment, onClose, onImportSuccess, onOpenVisualPanel]);

  // Calculate valid reviews count based on rating criteria
  const parsedValidCount = useMemo(() => {
    return parsedReviews.filter(r => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5).length;
  }, [parsedReviews]);

  const validReviews = useMemo(() => {
    return parsedReviews.filter(r => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5);
  }, [parsedReviews]);

  const canImport = !isImporting && parsedValidCount > 0;

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
            ) : importLabel ? (
              importLabel
            ) : (
              `Importer (${parsedValidCount} avis)`
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