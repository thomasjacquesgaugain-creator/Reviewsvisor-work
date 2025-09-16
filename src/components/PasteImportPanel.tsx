import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parsePastedReviews, ParsedReview } from "@/utils/parsePastedReviews";
import { Star, Loader2 } from "lucide-react";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { bulkCreateReviews, ReviewCreate } from "@/services/reviewsService";
import { useToast } from "@/hooks/use-toast";

interface PasteImportPanelProps {
  onImportBulk?: (reviews: any[]) => void;
  onClose?: () => void;
}

export default function PasteImportPanel({ onImportBulk, onClose }: PasteImportPanelProps) {
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
    }));

    setIsImporting(true);
    try {
      const { inserted, skipped } = await bulkCreateReviews(payload);
      toast({
        title: "✅ Import réussi",
        description: (
          <span data-testid="toast-import-success">{`${inserted} avis enregistrés pour ${est.name} (doublons ignorés : ${skipped}).`}</span>
        ),
      });
      // Nettoyage silencieux
      setParsedReviews([]);
      setPastedText("");
      setShowPreview(false);
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
  }, [currentEstablishment, parsedReviews, onClose]);

  // Calculate valid reviews count based on rating criteria
  const validReviews = useMemo(() => {
    const source = parsedReviews?.length ? parsedReviews : parsePastedReviews(pastedText || "");
    return (source || []).filter(r => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5);
  }, [parsedReviews, pastedText]);

  const canImport = !isImporting && validReviews.length > 0;

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
              
              <div className="overflow-x-auto">
                <table 
                  data-testid="paste-preview-table"
                  className="w-full border-collapse border border-border"
                >
                  <thead>
                    <tr className="bg-muted/50">
                      <th scope="col" className="border border-border px-3 py-2 text-left text-sm font-medium">
                        Auteur
                      </th>
                      <th scope="col" className="border border-border px-3 py-2 text-left text-sm font-medium">
                        Note
                      </th>
                      <th scope="col" className="border border-border px-3 py-2 text-left text-sm font-medium">
                        Commentaire
                      </th>
                      <th scope="col" className="border border-border px-3 py-2 text-left text-sm font-medium">
                        Source
                      </th>
                      <th scope="col" className="border border-border px-3 py-2 text-left text-sm font-medium">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedReviews.map((review, index) => (
                      <tr
                        key={index}
                        className={!review.isValid ? "border-destructive bg-destructive/5" : ""}
                      >
                        <td className="border border-border px-3 py-2 text-sm">
                          {review.firstName} {review.lastName}
                        </td>
                        <td className="border border-border px-3 py-2">
                          {renderStars(review.rating)}
                        </td>
                        <td className="border border-border px-3 py-2 text-sm max-w-md">
                          <div className="truncate" title={review.comment || "Pas de commentaire"}>
                            {review.comment ? (
                              review.comment
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