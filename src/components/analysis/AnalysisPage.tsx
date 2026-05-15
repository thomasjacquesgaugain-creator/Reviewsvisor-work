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
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ListOrdered } from "lucide-react";
import { t } from "i18next";
import { cn } from "@/lib/utils";

interface AnalysisPageProps {
  data: CompleteAnalysisData;
  establishmentName?: string;
  insight?:any;
  reviews?: Review[]; // Avis bruts pour le graphique d'historique
  dynamicThemes?: Array<{ theme: string; count?: number; importance?: number }>; // Thèmes dynamiques depuis insight
}

const ANALYSIS_TOC_SECTIONS = [
  { id: "overview-section", label: `1. ${t("analysis.overview.title", "Vue d'ensemble")} – ${t("analysis.overview.kpiTitle", "Key KPIs")}` },
  { id: "history-section", label: `2. ${t("analysis.history.title", "Review History and Dynamics")}` },
  { id: "sentiment-section", label: `3. ${t("analysis.sentiment.heading", "Distribution of Reviews")}` },
  { id: "themes-section", label: `4. ${t("analysis.themes.heading", "Thematic Analysis")}` },
  { id: "pareto-section", label: `5. ${t("analysis.pareto.title", "Pareto Chart")}` },
  { id: "root-cause-section", label: `6. ${t("analysis.ishikawa.title", "Root Cause Analysis")}` },
  { id: "diagnostic-section", label: `7. ${t("analysis.syntheseAndDiagnostic.title", "Synthesis and Diagnostic")}` },
] as const;

export function AnalysisPage({ data, establishmentName,insight,  reviews, dynamicThemes = [] }: AnalysisPageProps) {
  const { t } = useTranslation();

  const [activeSection, setActiveSection] = useState("overview-section");
  const analysisSections = useMemo(
    () => [
      ...ANALYSIS_TOC_SECTIONS.map((s) => ({ id: s.id, label: s.label })),
      {
        id: "lexique-section",
        label: `8. ${t("analysis.lexique.title")}`,
      },
    ],
    [t],
  );

  useEffect(() => {
  const handleScroll = () => {
    const sectionIds = analysisSections.map((s) => s.id);

    let currentSection = sectionIds[0];

    for (const id of sectionIds) {
      const element = document.getElementById(id);

      if (element) {
        const rect = element.getBoundingClientRect();

        if (rect.top <= 140) {
          currentSection = id;
        }
      }
    }

    setActiveSection(currentSection);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  handleScroll();

  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}, [analysisSections]);

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
      <div className="mx-auto">
        <AnalysisFiltersProvider reviews={reviews}>
          {/* En-tête */}
          <div className="mb-4 mt-4">
            <h1 className="text-3xl font-bold text-white normal-case">{APP_NAME}</h1>
            <p className="mt-1 text-lg md:text-xl font-normal text-slate-100 normal-case">
              {/* {APP_TAGLINE} */}
              {t("dashboard.appTagline")}
            </p>
          </div>

          <ThematicSegmentationBar />

          <div className="flex items-stretch gap-8 lg:gap-6">
            <aside className="hidden lg:block w-72 shrink-0 pt-1">
              <div className="sticky top-24 z-10 flex max-h-[calc(100vh-6rem)] flex-col rounded-2xl border border-border bg-background backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="shrink-0 border-b border-border px-4 pb-3 pt-4">
                  <div className="flex gap-3">
                    <ListOrdered
                      className="mt-0.5 h-5 w-5 shrink-0 text-foreground"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <h2
                        id="analysis-toc-heading"
                        className="text-sm font-semibold leading-snug text-foreground"
                      >
                        {t("analysis.tocSidebar.title")}
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {t("analysis.tocSidebar.description")}
                      </p>
                    </div>
                  </div>
                </div>
                <nav
                  className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2"
                  aria-labelledby="analysis-toc-heading"
                >
                  {analysisSections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => {
                        document.getElementById(section.id)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 border-l-2",
                        activeSection === section.id
                          ? "bg-primary/50 text-slate-900 dark:text-primary-foreground font-medium border-primary border-l-2 rounded-l"
                          : "text-slate-600 dark:text-slate-100 hover:bg-accent/50 hover:text-slate-900 dark:hover:text-foreground border-transparent"
                      )}
                    >
                      {section.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Contenu analyse */}
            <div className="flex-1 min-w-0">
              <AnalysisContent
                data={data}
                reviews={reviews}
                dynamicThemes={dynamicThemes}
                insight={insight}
              />
            </div>
          </div>
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
  insight:any;
  dynamicThemes?: Array<{ theme: string; count?: number; importance?: number }>;
}

function AnalysisContent({ data, reviews,insight, dynamicThemes = [] }: AnalysisContentProps) {
  const { filteredReviews, ratingFilter, periodFilter, sourceFilter, availableSources } = useAnalysisFilters();
    const { t } = useTranslation();

  const isSourceFilterActive = sourceFilter !== "ALL" && availableSources.length > 1;
  const isAnyFilterActive =
    ratingFilter !== "ALL" || periodFilter.preset !== "all" || isSourceFilterActive;

  const effectiveReviews = filteredReviews;

  if (isAnyFilterActive && effectiveReviews.length === 0) {
    return (
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-900">
          {t("dashboard.noReviewsForSelectedPeriod")}
        </p>
        <p className="mt-1 text-xs text-slate-500">
         {t("dashboard.tryWiderPeriod")}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Section 1: Vue d'ensemble */}
      {/* {data.overview && <OverviewSection data={data.overview} reviews={effectiveReviews} insight={insight} themes={data.themes} />} */}
      <section id="overview-section" className="scroll-mt-[6.5rem]">
        {data.overview && (
          <OverviewSection
            data={data.overview}
            reviews={effectiveReviews}
            insight={insight}
            themes={data.themes}
          />
        )}
      </section>

      {/* Titre de section 2 */}
      <section id="history-section" className="scroll-mt-[6.5rem]">
      <h2 className="text-2xl font-bold text-white mt-12 mb-6">
        2. {t("analysis.history.title")}
      </h2>

      {/* Section 2: Historique & dynamique */}
      {(data.history || effectiveReviews) && (
        <HistorySection data={data.history} reviews={effectiveReviews} />
      )}
      </section>

      {/* Titre de section 3 */}
      <section id="sentiment-section" className="scroll-mt-[6.5rem]">
      <h2 className="text-2xl font-bold text-white mt-12 mb-6">
        3. {t("analysis.sentiment.heading")}
      </h2>

      {/* Section 3: Répartition sentiments */}
      {(data.sentiment || effectiveReviews) && (
        <SentimentDistributionSection data={data.sentiment} reviews={effectiveReviews} />
      )}
      </section>

      {/* Titre de section 4 */}
      <section id="themes-section" className="scroll-mt-[6.5rem]">
      <h2 className="text-2xl font-bold text-white mt-12 mb-6">
        4. {t("analysis.themes.heading")}
      </h2>

      {/* Section 4a: Analyse par thèmes (graphique radar + barres + commentaires) */}
      {data.themes && (
        <div className="mb-8">
          <ThemesSection data={data.themes} />
        </div>
      )}

      {/* Section 4b: Analyse qualitative */}
      {data.qualitative && <QualitativeSection data={data.qualitative} reviews={effectiveReviews} dynamicThemes={dynamicThemes} />}
      </section>

      {/* Titre de section 5 */}
      <section id="pareto-section" className="scroll-mt-[6.5rem]">
      <h2 className="text-2xl font-bold text-white mt-12 mb-6 flex items-center gap-2">
        5. {t("analysis.pareto.title")}
        <InfoTooltip 
          content={t("analysis.pareto.tooltipInfo")}
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
        </section>

      {/* Titre de section 6 */}
      <section id="root-cause-section" className="scroll-mt-[6.5rem]">
      <h2 className="text-2xl font-bold text-white mt-12 mb-6">
       6. {t("analysis.ishikawa.title")}
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
      </section>

      {/* Titre de section 7 */}
      <section id="diagnostic-section" className="scroll-mt-[6.5rem]">
      <h2 className="text-2xl font-bold text-white mt-12 mb-6">
        7. {t("analysis.syntheseAndDiagnostic.title")}
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
      </section>

      {/* Section Lexique (repliable) */}
      <section id="lexique-section" className="scroll-mt-[6.5rem]">
        <LexiqueSection />
      </section>
    </>
  );
}

