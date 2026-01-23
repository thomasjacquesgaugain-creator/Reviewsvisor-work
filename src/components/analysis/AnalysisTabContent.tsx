import { AnalysisPage } from "./AnalysisPage";
import { transformAnalysisData } from "@/utils/transformAnalysisData";
import { CompleteAnalysisData, Review } from "@/types/analysis";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

interface AnalysisTabContentProps {
  analyse: any; // Insight data from backend
  reviews: Review[];
  establishmentName?: string;
  isLoading?: boolean;
  useMockData?: boolean;
}

export function AnalysisTabContent({
  analyse,
  reviews,
  establishmentName,
  isLoading = false,
  useMockData = false
}: AnalysisTabContentProps) {
  // Transformer les données insight + reviews en CompleteAnalysisData
  const analysisData: CompleteAnalysisData | null = useMemo(() => {
    if (!analyse || !reviews || reviews.length === 0) {
      return null;
    }

    try {
      return transformAnalysisData(analyse, reviews);
    } catch (error) {
      console.error('[AnalysisTabContent] Error transforming data:', error);
      return null;
    }
  }, [analyse, reviews]);

  // État de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyse en cours...</p>
        </div>
      </div>
    );
  }

  // Pas de données disponibles
  if (!analysisData && !useMockData) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Aucune donnée d'analyse disponible</p>
        <p className="text-xs mt-2">Importez des avis et lancez une analyse pour voir les résultats</p>
      </div>
    );
  }

  // Utiliser les données mock si demandé (pour le développement/démo)
  // TODO: Implémenter les données mock si nécessaire
  const dataToUse = analysisData;

  if (!dataToUse) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <AnalysisPage
      data={dataToUse}
      establishmentName={establishmentName}
      reviews={reviews}
    />
  );
}
