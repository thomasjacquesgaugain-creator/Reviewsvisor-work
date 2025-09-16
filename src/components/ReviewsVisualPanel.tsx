import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, MessageSquare } from "lucide-react";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { ReviewsFeed } from "@/components/ReviewsFeed";

interface ReviewsVisualPanelProps {
  onClose: () => void;
}

export function ReviewsVisualPanel({ onClose }: ReviewsVisualPanelProps) {
  const currentEstablishment = useCurrentEstablishment();

  // Scroll to panel when opened
  useEffect(() => {
    if (currentEstablishment?.id) {
      const timer = setTimeout(() => {
        document.getElementById('reviews-visual-anchor')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentEstablishment?.id]);

  return (
    <Card className="relative z-20 max-w-4xl mx-auto" data-testid="reviews-visual-panel">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Avis de l'établissement
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          data-testid="btn-close-reviews-visual"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        {!currentEstablishment ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun établissement sélectionné
          </p>
        ) : (
          <div>
            <h3 className="text-lg font-medium mb-4">
              Avis pour {currentEstablishment.name}
            </h3>
            <ReviewsFeed establishmentId={currentEstablishment.id || currentEstablishment.place_id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}