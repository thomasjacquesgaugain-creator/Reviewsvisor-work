import { CompleteAnalysisData, Review } from "@/types/analysis";
import { OverviewSection } from "./OverviewSection";
import { HistorySection } from "./HistorySection";
import { SentimentDistributionSection } from "./SentimentDistributionSection";
import { ParetoSection } from "./ParetoSection";
import { ThemesSection } from "./ThemesSection";
import { QualitativeSection } from "./QualitativeSection";
import { DiagnosticSection } from "./DiagnosticSection";
import { RootCauseSection } from "./RootCauseSection";
import { LexiqueSection } from "./LexiqueSection";
import { AnalysisFiltersProvider, useAnalysisFilters } from "./AnalysisFiltersContext";
import { ThematicSegmentationBar } from "./ThematicSegmentationBar";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { APP_NAME, APP_TAGLINE } from "@/config/brand";

interface AnalysisPageProps {
  data: CompleteAnalysisData;
  establishmentName?: string;
  reviews?: Review[]; // Avis bruts pour le graphique d'historique
  dynamicThemes?: Array<{ theme: string; count?: number; importance?: number }>; // Thèmes dynamiques depuis insight
}

export function AnalysisPage({ data, establishmentName, reviews, dynamicThemes = [] }: AnalysisPageProps) {
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
        <AnalysisFiltersProvider reviews={reviews}>
          {/* En-tête */}
          <div className="mb-4 mt-4">
            <h1 className="text-3xl font-bold text-gray-800 normal-case">{APP_NAME}</h1>
            <p className="mt-1 text-lg md:text-xl font-normal text-slate-600 normal-case">
              {APP_TAGLINE}
            </p>
          </div>

          {/* Contexte global d'analyse */}
          <ThematicSegmentationBar />

          <AnalysisContent data={data} reviews={reviews} dynamicThemes={dynamicThemes} />
        </AnalysisFiltersProvider>
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

interface AnalysisContentProps {
  data: CompleteAnalysisData;
  reviews?: Review[];
  dynamicThemes?: Array<{ theme: string; count?: number; importance?: number }>;
}

function AnalysisContent({ data, reviews, dynamicThemes = [] }: AnalysisContentProps) {
  const { filteredReviews, ratingFilter, periodFilter, sourceFilter, availableSources } = useAnalysisFilters();
  const isSourceFilterActive = sourceFilter !== "ALL" && availableSources.length > 1;
  const isAnyFilterActive =
    ratingFilter !== "ALL" || periodFilter.preset !== "all" || isSourceFilterActive;

  const effectiveReviews = filteredReviews;

  if (isAnyFilterActive && effectiveReviews.length === 0) {
    return (
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-900">
          Aucun avis sur la période sélectionnée
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Essayez d’élargir la période ou de réinitialiser les filtres.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Section 1: Vue d'ensemble */}
      {data.overview && <OverviewSection data={data.overview} reviews={effectiveReviews} />}

      {/* Titre de section 2 */}
      <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6">
        2. Historique & dynamique des avis
      </h2>

      {/* Section 2: Historique & dynamique */}
      {(data.history || effectiveReviews) && (
        <HistorySection data={data.history} reviews={effectiveReviews} />
      )}

      {/* Titre de section 3 */}
      <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6">
        3. Répartition des avis (positifs / neutres / négatifs)
      </h2>

      {/* Section 3: Répartition sentiments */}
      {(data.sentiment || effectiveReviews) && (
        <SentimentDistributionSection data={data.sentiment} reviews={effectiveReviews} />
      )}

      {/* Titre de section 4 */}
      <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6">
        4. Analyse thématique
      </h2>

      {/* Section 4a: Analyse par thèmes (graphique radar + barres + commentaires) */}
      {data.themes && (
        <div className="mb-8">
          <ThemesSection data={data.themes} />
        </div>
      )}

      {/* Section 4b: Analyse qualitative */}
      {data.qualitative && <QualitativeSection data={data.qualitative} reviews={effectiveReviews} dynamicThemes={dynamicThemes} />}

      {/* Titre de section 5 */}
      <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6 flex items-center gap-2">
        5. Diagramme de Pareto des avis négatifs et positifs
        <InfoTooltip 
          content="Analyse de Pareto : méthode montrant quels problèmes génèrent la majorité des insatisfactions. Bénéfice : vous concentrez vos efforts sur les causes qui auront le plus d'impact."
        />
      </h2>

        {/* Section 5: Pareto des irritants & satisfactions */}
        {data.paretoIssues && data.paretoStrengths && (
          <ParetoSection 
            issues={data.paretoIssues} 
            strengths={data.paretoStrengths}
            themes={data.themes}
            qualitative={data.qualitative}
          />
        )}

      {/* Titre de section 6 */}
      <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6">
        6. Analyse des causes racines (Ishikawa IA)
      </h2>

      {/* Section 6: Analyse des causes racines */}
      {data.paretoIssues && data.paretoIssues.length > 0 && (
        <RootCauseSection
          paretoIssues={data.paretoIssues}
          themes={data.themes}
          qualitative={data.qualitative}
          reviews={effectiveReviews}
        />
      )}

      {/* Titre de section 7 */}
      <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6" id="diagnostic-section">
        7. Synthèse & diagnostic
      </h2>

      {/* Section 7: Synthèse & diagnostic */}
      {data.diagnostic && (
        <DiagnosticSection 
          data={data.diagnostic}
          overview={data.overview}
          paretoIssues={data.paretoIssues}
          totalReviews={effectiveReviews?.length || data.overview?.totalReviews || 0}
        />
      )}

      {/* Section Lexique (repliable) */}
      <LexiqueSection />
    </>
  );
}

