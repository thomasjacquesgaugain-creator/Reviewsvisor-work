import { AnalysisPage } from "./AnalysisPage";
import { transformAnalysisData } from "@/utils/transformAnalysisData";
import { mockAnalysisData } from "./mockData";
import { Review } from "@/types/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalysisTabContentProps {
  analyse: any; // Données insight de Supabase
  reviews: Review[]; // Liste des avis
  establishmentName?: string;
  isLoading?: boolean;
  useMockData?: boolean; // Si true, utiliser les données mockées
}

export function AnalysisTabContent({
  analyse,
  reviews,
  establishmentName,
  isLoading = false,
  useMockData = false
}: AnalysisTabContentProps) {
  // ⚠️ PROTECTION DONNÉES: Vérification avant utilisation
  if (!reviews || reviews.length === 0) {
    console.warn('[PROTECTION DONNÉES] ⚠️ ATTENTION: Aucun avis trouvé - vérifier la source de données', {
      hasAnalyse: !!analyse,
      establishmentName
    });
  }
  
  console.log('[AnalysisTabContent] Rendu du composant', { 
    isLoading, 
    useMockData, 
    hasAnalyse: !!analyse, 
    reviewsCount: reviews?.length || 0,
    establishmentName 
  });

  // Utiliser les données réelles si disponibles, sinon les mockées
  let dataToRender;
  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  try {
    // Si on demande les données mockées ou s'il n'y a pas de données réelles, utiliser les mockées
    if (useMockData || !analyse || !reviews || reviews.length === 0) {
      console.log('[AnalysisTabContent] Utilisation des données mockées');
      dataToRender = mockAnalysisData;
    } else {
      // Transformer les vraies données
      console.log('[AnalysisTabContent] Transformation des données réelles', { 
        analyse, 
        reviewsCount: reviews.length 
      });
      dataToRender = transformAnalysisData(analyse, reviews);
    }

    return (
      <ErrorBoundary>
        <AnalysisPage
          data={dataToRender}
          establishmentName={establishmentName}
          reviews={reviews} // Passer les reviews bruts pour le graphique d'historique
        />
      </ErrorBoundary>
    );
  } catch (error: any) {
    console.error('[AnalysisTabContent] Erreur de rendu:', error);
    // En cas d'erreur, utiliser les données mockées comme fallback
    return (
      <ErrorBoundary>
        <AnalysisPage
          data={mockAnalysisData}
          establishmentName={establishmentName}
          reviews={reviews} // Passer les reviews même en cas d'erreur
        />
      </ErrorBoundary>
    );
  }
}
