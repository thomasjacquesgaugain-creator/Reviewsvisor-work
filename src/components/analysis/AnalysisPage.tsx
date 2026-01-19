import { CompleteAnalysisData, Review } from "@/types/analysis";
import { OverviewSection } from "./OverviewSection";
import { HistorySection } from "./HistorySection";
import { SentimentDistributionSection } from "./SentimentDistributionSection";
import { ParetoSection } from "./ParetoSection";
import { ThemesSection } from "./ThemesSection";
import { QualitativeSection } from "./QualitativeSection";
import { DiagnosticSection } from "./DiagnosticSection";

interface AnalysisPageProps {
  data: CompleteAnalysisData;
  establishmentName?: string;
  reviews?: Review[]; // Avis bruts pour le graphique d'historique
}

export function AnalysisPage({ data, establishmentName, reviews }: AnalysisPageProps) {
  console.log('[AnalysisPage] Reviews reçus:', reviews);
  console.log('[AnalysisPage] Rendu avec données:', { 
    hasData: !!data, 
    establishmentName,
    hasOverview: !!data?.overview,
    hasHistory: !!data?.history,
    hasSentiment: !!data?.sentiment,
    hasPareto: !!data?.paretoIssues,
    hasThemes: !!data?.themes,
    hasQualitative: !!data?.qualitative,
    hasDiagnostic: !!data?.diagnostic,
    reviewsCount: reviews?.length || 0
  });

  // Protection contre les données invalides
  if (!data) {
    return (
      <div className="space-y-8 p-6">
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="max-w-7xl mx-auto px-6">
        {/* En-tête */}
        {establishmentName && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">{establishmentName}</h1>
            <p className="text-gray-500 mt-2">
              Analyse complète des avis clients
            </p>
          </div>
        )}

        {/* Section 1: Vue d'ensemble */}
        {data.overview && <OverviewSection data={data.overview} />}

        {/* Titre de section 2 */}
        <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6">2. Historique & dynamique des avis</h2>

        {/* Section 2: Historique & dynamique */}
        {(data.history || reviews) && <HistorySection data={data.history} reviews={reviews} />}

        {/* Titre de section 3 */}
        <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6">3. Répartition des avis (positifs / neutres / négatifs)</h2>

        {/* Section 3: Répartition sentiments */}
        {(data.sentiment || reviews) && <SentimentDistributionSection data={data.sentiment} reviews={reviews} />}

        {/* Titre de section 4 */}
        <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6">4. Pareto des irritants & satisfactions</h2>

        {/* Section 4: Pareto des irritants & satisfactions */}
        {data.paretoIssues && data.paretoStrengths && (
          <ParetoSection issues={data.paretoIssues} strengths={data.paretoStrengths} />
        )}

        {/* Section 5: Analyse par thématiques */}
        {data.themes && <ThemesSection data={data.themes} />}

        {/* Section 6: Analyse qualitative */}
        {data.qualitative && <QualitativeSection data={data.qualitative} />}

        {/* Section 7: Synthèse & diagnostic */}
        {data.diagnostic && <DiagnosticSection data={data.diagnostic} />}
      </div>
    );
  } catch (error: any) {
    console.error('Erreur dans AnalysisPage:', error);
    return (
      <div className="space-y-8 p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Erreur de rendu</h2>
          <p className="text-sm text-red-800">{error?.message || 'Erreur inconnue'}</p>
        </div>
      </div>
    );
  }
}
