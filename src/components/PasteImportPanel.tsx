import { useState } from "react";
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

  const handleImport = async () => {
    if (!currentEstablishment) {
      toast({
        title: "Erreur",
        description: "Impossible d'identifier l'établissement courant. Réessayez depuis la page de l'établissement.",
        variant: "destructive",
      });
      return;
    }
    
    // Filter only valid reviews (with rating 1-5)
    const validReviews = parsedReviews.filter(review => 
      Number.isFinite(review.rating) && review.rating >= 1 && review.rating <= 5
    );
    
    if (validReviews.length === 0) {
      toast({
        title: "Aucun avis valide",
        description: "Aucun avis avec une note valide (1-5) n'a été trouvé.",
        variant: "destructive",
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      // Convert to ReviewCreate format
      const reviewsToCreate: ReviewCreate[] = validReviews.map(review => ({
        establishment_id: currentEstablishment.id || currentEstablishment.place_id,
        establishment_place_id: currentEstablishment.place_id,
        establishment_name: currentEstablishment.name,
        source: review.platform || "pasted",
        author_first_name: review.firstName || "",
        author_last_name: review.lastName || "",
        rating: review.rating,
        comment: review.comment || "",
        review_date: review.reviewDate || null,
        import_method: "paste",
        import_source_url: null
      }));
      
      const result = await bulkCreateReviews(reviewsToCreate);
      
      // Success toast
      toast({
        title: "✅ Import réussi",
        description: `${result.inserted} avis enregistrés pour ${currentEstablishment.name}${result.skipped > 0 ? ` (doublons ignorés : ${result.skipped})` : ''}.`,
      });
      
      // Reset state
      setPastedText("");
      setParsedReviews([]);
      setShowPreview(false);
      
      // Optionally close the import toolbar
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error('Error importing reviews:', error);
      toast({
        title: "Erreur d'import",
        description: "Une erreur est survenue lors de l'import des avis. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Calculate valid reviews count based on rating criteria
  const validReviews = parsedReviews.filter(review => 
    Number.isFinite(review.rating) && review.rating >= 1 && review.rating <= 5
  );
  const validReviewsCount = validReviews.length;

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
    <div data-testid="paste-import-panel" className="space-y-6">
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

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          data-testid="btn-paste-preview"
          variant="outline"
          onClick={handlePreview}
          disabled={!pastedText.trim()}
        >
          Aperçu
        </Button>
        
        <Button
          data-testid="btn-paste-import"
          type="button"
          onClick={handleImport}
          disabled={!showPreview || validReviewsCount === 0 || isImporting || !currentEstablishment}
          className="pointer-events-auto relative z-10"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Import en cours...
            </>
          ) : (
            `Importer (${validReviewsCount} avis)`
          )}
        </Button>
      </div>

      {/* Preview table */}
      {showPreview && parsedReviews.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-4">
              Aperçu des avis détectés ({parsedReviews.length} total, {validReviewsCount} valides)
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
      )}

      {showPreview && parsedReviews.length === 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Aucun avis détecté dans le texte collé. Vérifiez le format ou essayez de coller un autre contenu.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}