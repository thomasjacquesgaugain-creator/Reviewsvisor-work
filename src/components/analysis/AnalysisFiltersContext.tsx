import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { Review } from "@/types/analysis";
import {
  filterReviews,
  PeriodFilter,
  RatingFilter,
  ReviewFilterOptions,
  SourceFilter,
} from "@/utils/filterReviews";

interface AnalysisFiltersContextValue extends ReviewFilterOptions {
  filteredReviews: Review[];
  totalReviews: number;
  setRatingFilter: (value: RatingFilter) => void;
  setPeriodFilter: (value: PeriodFilter) => void;
  setSourceFilter: (value: SourceFilter) => void;
  availableSources: string[];
  minReviewDate?: Date;
  maxReviewDate?: Date;
}

const AnalysisFiltersContext = createContext<AnalysisFiltersContextValue | undefined>(
  undefined
);

interface AnalysisFiltersProviderProps {
  reviews?: Review[];
  children: ReactNode;
}

export function AnalysisFiltersProvider({
  reviews = [],
  children,
}: AnalysisFiltersProviderProps) {
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("ALL");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({
    preset: "ALL_TIME",
  });
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("google");

  const totalReviews = reviews.length;

  const availableSources = useMemo(
    () => Array.from(new Set(reviews.map((r) => r.source))).filter(Boolean),
    [reviews]
  );

  const minReviewDate = useMemo(() => {
    if (!reviews.length) return undefined;
    return new Date(
      Math.min(
        ...reviews.map((r) => {
          const d = new Date(r.date);
          return isNaN(d.getTime()) ? Date.now() : d.getTime();
        })
      )
    );
  }, [reviews]);

  const maxReviewDate = useMemo(() => {
    if (!reviews.length) return undefined;
    return new Date(
      Math.max(
        ...reviews.map((r) => {
          const d = new Date(r.date);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        })
      )
    );
  }, [reviews]);

  const filteredReviews = useMemo(
    () =>
      filterReviews(reviews, {
        ratingFilter,
        periodFilter,
        sourceFilter,
      }),
    [reviews, ratingFilter, periodFilter, sourceFilter]
  );

  const value: AnalysisFiltersContextValue = {
    ratingFilter,
    periodFilter,
    sourceFilter,
    filteredReviews,
    totalReviews,
    availableSources,
    minReviewDate,
    maxReviewDate,
    setRatingFilter,
    setPeriodFilter,
    setSourceFilter,
  };

  return (
    <AnalysisFiltersContext.Provider value={value}>
      {children}
    </AnalysisFiltersContext.Provider>
  );
}

export function useAnalysisFilters() {
  const ctx = useContext(AnalysisFiltersContext);
  if (!ctx) {
    throw new Error("useAnalysisFilters must be used within AnalysisFiltersProvider");
  }
  return ctx;
}

